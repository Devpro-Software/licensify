package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) setupLicenseEndpoints(gapi *gin.RouterGroup) {
	gapi.GET("/licenses", func(ctx *gin.Context) {
		var licenses []*License
		if err := s.db.Find(&licenses).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &licenses)
	})

	gapi.POST("/licenses", func(ctx *gin.Context) {
		var req struct {
			Name   string         `json:"name"`
			Data   map[string]any `json:"data"`
			Active bool           `json:"active"`
		}

		if err := json.NewDecoder(ctx.Request.Body).Decode(&req); err != nil {
			http.Error(ctx.Writer, "Invalid body", http.StatusBadRequest)
			return
		}
		defer ctx.Request.Body.Close()

		license := License{}
		license.ID = uuid.New().String()
		license.Active = req.Active
		license.Name = req.Name
		license.Data = req.Data

		if err := s.db.Create(&license).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, license)
	})

	gapi.GET("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gapi.PUT("/licenses/:id", func(ctx *gin.Context) {
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
			license.Name = name
		}

		var entries map[string]any
		if err := ctx.ShouldBindJSON(&entries); err == nil {
			for k, v := range entries {
				if v == "" {
					delete(license.Data, k)
				} else {
					license.Data[k] = v
				}
			}
		}

		if err := s.db.Save(&license).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gapi.DELETE("/licenses/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", id).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		if err := s.db.Where("license_id = ?", license.ID).Delete(&Validation{}).Error; err != nil {
			internalError(ctx, err)
			return
		}

		if err := s.db.Where("license_id = ?", license.ID).Delete(&Tracker{}).Error; err != nil {
			internalError(ctx, err)
			return
		}

		err := s.db.Delete(&license).Error
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.Status(http.StatusAccepted)
	})

	gapi.POST("/licenses/:id/sign", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		var claims map[string]any
		if ctx.ShouldBindJSON(&claims) != nil {
			claims = map[string]any{
				"license-id": license.ID,
				"name":       license.Name,
			}
		}

		switch ctx.Query("type") {
		case "tracked":
			trackerID := ctx.Query("trackerId")
			if trackerID != "" {
				var tracker Tracker
				if err := s.db.First(&tracker, "id = ?", trackerID).Error; err != nil {
					ctx.String(http.StatusBadRequest, "Invalid tracker id")
					return
				}

				claims["tracker"] = tracker.ID
			} else {
				var count int64
				s.db.Model(&Tracker{}).Where("license_id = ?", license.ID).Count(&count)
				tracker := &Tracker{}
				tracker.ID = uuid.NewString()
				tracker.Enabled = false
				tracker.LicenseID = license.ID
				tracker.Name = fmt.Sprintf("Tracker %d", count+1)
				if err := s.db.Create(tracker).Error; err != nil {
					internalError(ctx, err)
					return
				}

				claims["tracker"] = tracker.ID
			}
		}

		var keyPair KeyPair
		s.db.First(&keyPair)
		priv, err := licensify.LoadPrivateKeyBase64(keyPair.PrivateKey)
		if err != nil {
			internalError(ctx, err)
			return
		}

		sig, err := licensify.NewSigner(priv).Sign(licensify.NewLicense(claims))
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &sig)
	})

	gapi.POST("/licenses/:id/presets", func(c *gin.Context) {
		licenseID := c.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		var req struct {
			CreateTracker bool                   `json:"createTracker"`
			Data          map[string]interface{} `json:"data"`
		}

		if err := c.BindJSON(&req); err != nil {
			return
		}

		preset := &Preset{}
		preset.ID = uuid.NewString()
		preset.CreateTracker = req.CreateTracker
		preset.Data = req.Data

		if err := s.db.Create(preset).Error; err != nil {
			internalError(c, err)
			return
		}
	})

	gapi.GET("/licenses/:id/presets", func(c *gin.Context) {
		licenseID := c.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		var presets []*Preset
		if err := s.db.Find(&presets).Error; err != nil {
			internalError(c, err)
			return
		}
	})
}
