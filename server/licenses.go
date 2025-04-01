package main

import (
	"encoding/json"
	"net/http"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) setupLicenseEndpoints(gr *gin.RouterGroup) {
	gr.GET("/licenses", func(ctx *gin.Context) {
		var licenses []*License
		if err := s.db.Find(&licenses).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &licenses)
	})

	gr.POST("/licenses", func(ctx *gin.Context) {
		var req struct {
			Product string         `json:"product"`
			Data    map[string]any `json:"data"`
			Active  bool           `json:"active"`
		}

		if err := json.NewDecoder(ctx.Request.Body).Decode(&req); err != nil {
			http.Error(ctx.Writer, "Invalid body", http.StatusBadRequest)
			return
		}
		defer ctx.Request.Body.Close()

		license := License{}
		license.ID = uuid.New().String()
		license.Active = req.Active
		license.Product = req.Product
		license.Data = req.Data

		if err := s.db.Create(&license).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, license)
	})

	gr.GET("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gr.PUT("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		active := ctx.Request.URL.Query().Get("active")
		switch active {
		case "true":
			license.Active = true
		case "false":
			license.Active = false
		}

		name := ctx.Request.URL.Query().Get("name")
		if name != "" {
			license.Product = name
		}

		s.db.Save(&license)
		ctx.JSON(http.StatusOK, &license)
	})

	gr.DELETE("/licenses/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", id).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		err := s.db.Delete(&license).Error
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.Status(http.StatusAccepted)
	})

	gr.POST("/licenses/:id/sign", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}
		sig, err := s.signer.Sign(licensify.NewLicense(map[string]string{
			"license-id": license.ID,
			"product":    license.Product,
		}))
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &sig)
	})
}
