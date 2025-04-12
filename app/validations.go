package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Server) setupValidationEndpoints(gapi *gin.RouterGroup) {
	gapi.GET("/validations/activity", func(ctx *gin.Context) {
		switch ctx.Query("type") {
		case "license":
			id := ctx.Query("licenseId")
			var result []struct {
				Date         string `json:"date"`
				Count        int    `json:"count"`
				SuccessCount int    `json:"successCount"`
			}

			start := time.Now().AddDate(0, -1, 0)
			err := s.db.Raw(`
                SELECT
                    date(created_at) AS date,
                    COUNT(*) AS count,
                    COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count
                FROM validations
                WHERE created_at >= ? AND license_id = ?
                GROUP BY date(created_at)
                ORDER BY date(created_at) ASC
                `, start, id).Scan(&result).Error
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, &result)
		case "licenses":
			var result []struct {
				*License     `json:"license"`
				SuccessCount int64 `json:"successCount"`
				TotalCount   int64 `json:"totalCount"`
			}

			err := s.db.Raw(`
                WITH stats AS (
                    SELECT
                        license_id,
                        COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count,
                        COUNT(*) as total_count
                    FROM validations
                    GROUP BY license_id
                )
                SELECT * FROM stats
                JOIN licenses ON stats.license_id = licenses.id
                ORDER BY stats.total_count ASC
                `).Scan(&result).Error
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, result)
		case "tracker":
			trackerId := ctx.Query("trackerId")
			var result []struct {
				Date         string `json:"date"`
				Count        int    `json:"count"`
				SuccessCount int    `json:"successCount"`
			}

			start := time.Now().AddDate(0, -1, 0)
			err := s.db.Raw(`
                SELECT
                    date(created_at) AS date,
                    COUNT(*) AS count,
                    COUNT(CASE WHEN status = 'Accepted' THEN 1 ELSE NULL END) as success_count
                FROM validations
                WHERE created_at >= ? AND tracker_id = ?
                GROUP BY date(created_at)
                ORDER BY date(created_at) ASC
                `, start, trackerId).Scan(&result).Error
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, result)
		default:
			weekStart := time.Now().AddDate(0, 0, -7)
			var result []struct {
				Date  string `json:"date"`
				Count int    `json:"count"`
			}
			err := s.db.Raw(`
            SELECT
                date(created_at) AS date,
                COUNT(*) AS count
            FROM validations
            WHERE created_at >= ?
            GROUP BY date(created_at)
            ORDER BY date(created_at) ASC
	`, weekStart).Scan(&result).Error
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, result)
		}
	})

	gapi.GET("/validations/count", func(ctx *gin.Context) {
		q := s.db.Model(&Validation{})
		licenseId := ctx.Query("licenseId")
		if licenseId != "" {
			q = q.Where("license_id = ?", licenseId)
		}

		trackerId := ctx.Query("trackerId")
		if trackerId != "" {
			q = q.Where("tracker_id = ?", trackerId)
		}

		var total int64
		if err := q.Count(&total).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, total)
	})

	gapi.GET("/validations", func(ctx *gin.Context) {
		var err error
		page := 0
		pageSize := 30

		pageStr := ctx.Query("page")
		if pageStr != "" {
			page, err = strconv.Atoi(pageStr)
			if err != nil || page < 0 {
				ctx.String(http.StatusBadRequest, "Invalid page value")
				return
			}
		}

		pageSizeStr := ctx.Query("pageSize")
		if pageSizeStr != "" {
			pageSize, err = strconv.Atoi(pageSizeStr)
			if err != nil || pageSize < 0 {
				ctx.String(http.StatusBadRequest, "Invalid pageSize value")
				return
			}
		}

		query := s.db.Model(&Validation{})
		query = query.Preload("License")
		query = query.Preload("Tracker")

		licenseId := ctx.Query("licenseId")
		if licenseId != "" {
			query = query.Where("license_id = ?", licenseId)
		}

		trackerId := ctx.Query("trackerId")
		if trackerId != "" {
			query = query.Where("tracker_id = ?", trackerId)
		}

		query = query.Offset(page * pageSize).Limit(pageSize)
		query = query.Order("created_at desc")

		var validations []*Validation
		if err := query.Find(&validations).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, validations)
	})
}
