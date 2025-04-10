package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (s *Server) setupTrackerEndpoints(gapi *gin.RouterGroup) {
	gapi.GET("/licenses/:id/trackers", func(c *gin.Context) {
		licenseID := c.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		var err error
		page := 0
		pageSize := 30

		q := s.db.Model(&Tracker{})
		q = s.db.Preload("License")
		q = q.Where("license_id = ?", license.ID)

		pageStr := c.Query("page")
		if pageStr != "" {
			page, err = strconv.Atoi(pageStr)
			if err != nil || page < 0 {
				c.String(http.StatusBadRequest, "Invalid page value")
				return
			}
		}

		pageSizeStr := c.Query("pageSize")
		if pageSizeStr != "" {
			pageSize, err = strconv.Atoi(pageSizeStr)
			if err != nil || pageSize < 0 {
				c.String(http.StatusBadRequest, "Invalid pageSize value")
				return
			}
		}

		name := c.Query("name")
		if name != "" {
			search := "%" + name + "%"
			q = q.Where("name LIKE ?", search)
		}

		q = q.Offset(page * pageSize).Limit(pageSize)
		q = q.Order("created_at DESC")

		var trackers []*Tracker
		err = q.Find(&trackers).Error
		if err != nil {
			internalError(c, err)
			return
		}

		c.JSON(http.StatusOK, trackers)
	})

	gapi.POST("/licenses/:id/trackers", func(c *gin.Context) {
		licenseID := c.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		tracker := &Tracker{}
		tracker.ID = uuid.NewString()
		tracker.Enabled = false
		tracker.LicenseID = license.ID

		name := c.Query("name")
		if name != "" {
			tracker.Name = name
		} else {
			var count int64
			s.db.Model(&Tracker{}).Where("license_id = ?", license.ID).Count(&count)
			tracker.Name = fmt.Sprintf("Tracker %d", count+1)
		}

		if err := s.db.Create(tracker).Error; err != nil {
			internalError(c, err)
			return
		}
	})

	gapi.GET("/licenses/:id/trackers/count", func(c *gin.Context) {
		licenseID := c.Param("id")
		var license License
		if s.db.First(&license, "id = ?", licenseID).Error != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		var count int64
		if err := s.db.Model(&Tracker{}).Where("license_id = ?", license.ID).Count(&count).Error; err != nil {
			internalError(c, err)
			return
		}

		c.JSON(http.StatusOK, count)
	})

	gapi.GET("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		var tracker Tracker
		if err := s.db.Preload("License").First(&tracker, "id = ?", trackerID).Error; err != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		c.JSON(http.StatusOK, tracker)
	})

	gapi.PUT("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		var tracker Tracker
		if err := s.db.First(&tracker, "id = ?", trackerID).Error; err != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		name := c.Query("name")
		if name != "" {
			tracker.Name = name
		}

		switch c.Query("enabled") {
		case "true":
			tracker.Enabled = true
		case "false":
			tracker.Enabled = false
		}

		switch c.Query("activated") {
		case "true":
			if tracker.ActivatedDate == nil {
				now := time.Now()
				tracker.ActivatedDate = &now
			}
		case "false":
			tracker.ActivatedDate = nil
		}

		if err := s.db.Save(&tracker).Error; err != nil {
			internalError(c, err)
			return
		}

		c.JSON(http.StatusOK, tracker)
	})

	gapi.DELETE("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		var tracker Tracker
		if err := s.db.First(&tracker, "id = ?", trackerID).Error; err != nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		if err := s.db.Model(&Validation{}).
			Where("tracker_id = ?", tracker.ID).
			Update("tracker_id", nil).Error; err != nil {
			internalError(c, err)
			return
		}

		if err := s.db.Delete(&tracker).Error; err != nil {
			internalError(c, err)
			return
		}

		c.Status(http.StatusOK)
	})
}
