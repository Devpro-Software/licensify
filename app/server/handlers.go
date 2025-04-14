package server

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Devpro-Software/licensify/licensify"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (s *Server) setup(g *gin.Engine) {
	g.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept", "Authorization", "API-KEY"},
	}))

	gapi := g.Group("/api")
	gauth := g.Group("/auth")

	extractPrincipal := func(ctx *gin.Context) *Principal {
		principal, exists := ctx.Get("principal")
		if !exists {
			return nil
		}

		p, ok := principal.(*Principal)
		if !ok {
			return nil
		}

		return p
	}

	authMiddleware := func(ctx *gin.Context) {
		if s.bypassAuth {
			session := s.api.TestSession()
			if session == nil {
				panic("failed to get test session")
			}

			ctx.Set("principal", &Principal{
				Principal: session,
				Type:      UserPrincipal,
			})
			return
		}

		abort := func() {
			ctx.Abort()
			ctx.Status(http.StatusUnauthorized)
		}

		authHeader := ctx.GetHeader("Authorization")
		prefix := "Bearer "
		if authHeader != "" {
			if !strings.HasPrefix(authHeader, prefix) {
				abort()
				return
			}

			client := s.api.Client()
			if client == nil {
				abort()
				return
			}

			token := strings.TrimPrefix(authHeader, prefix)
			if token != client.ApiKey {
				abort()
				return
			}

			ctx.Set("principal", &Principal{
				Principal: client,
				Type:      ServicePrincipal,
			})
			return
		}

		cookie, err := ctx.Cookie("session_token")
		if err != nil {
			abort()
			return
		}

		session := s.api.Session(cookie)
		if session == nil {
			abort()
			return
		}

		ctx.Set("principal", &Principal{
			Principal: session,
			Type:      UserPrincipal,
		})
	}

	gapi.Use(authMiddleware)

	gapi.GET("/licenses", func(ctx *gin.Context) {
		licenses, _ := s.api.Licenses()
		ctx.JSON(http.StatusOK, &licenses)
	})

	gapi.POST("/licenses", func(ctx *gin.Context) {
		var req struct {
			Name   string         `json:"name"`
			Data   map[string]any `json:"data"`
			Active bool           `json:"active"`
		}

		if ctx.BindJSON(&req) != nil {
			return
		}

		license, err := s.api.NewLicense(req.Name, req.Active, req.Data)
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, license)
	})

	gapi.GET("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		license := s.api.License(licenseID)
		if license == nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gapi.PUT("/licenses/:id", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		license := s.api.License(licenseID)
		if license == nil {
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

		if err := s.api.SaveLicense(license); err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &license)
	})

	gapi.DELETE("/licenses/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		license := s.api.License(id)
		if license == nil {
			http.NotFound(ctx.Writer, ctx.Request)
			return
		}

		if s.api.DeleteLicense(id) != nil {
			ctx.Status(http.StatusAccepted)
		}
	})

	gapi.POST("/licenses/:id/sign", func(ctx *gin.Context) {
		licenseID := ctx.Param("id")
		license := s.api.License(licenseID)
		if license == nil {
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
				tracker := s.api.Tracker(trackerID)
				claims["tracker"] = tracker.ID
			} else {
				tracker, _ := s.api.NewTracker(license.ID, "")
				claims["tracker"] = tracker.ID
			}
		}

		sig, err := s.api.Sign(claims)
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, &sig)
	})

	gapi.GET("/licenses/:id/trackers", func(c *gin.Context) {
		licenseID := c.Param("id")
		license := s.api.License(licenseID)
		if license == nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		ops := TrackersOptions{}
		ops.LicenseID = licenseID
		var err error

		pageStr := c.Query("page")
		if pageStr != "" {
			ops.Page, err = strconv.Atoi(pageStr)
			if err != nil || ops.Page < 0 {
				c.String(http.StatusBadRequest, "Invalid page value")
				return
			}
		}

		pageSizeStr := c.Query("pageSize")
		if pageSizeStr != "" {
			ops.PageSize, err = strconv.Atoi(pageSizeStr)
			if err != nil || ops.PageSize < 0 {
				c.String(http.StatusBadRequest, "Invalid pageSize value")
				return
			}
		}

		ops.Name = c.Query("name")
		trackers, _ := s.api.Trackers(ops)
		c.JSON(http.StatusOK, trackers)
	})

	gapi.POST("/licenses/:id/trackers", func(c *gin.Context) {
		licenseID := c.Param("id")
		license := s.api.License(licenseID)
		if license == nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		name := c.Query("name")
		s.api.NewTracker(license.ID, name)
	})

	gapi.GET("/licenses/:id/trackers/count", func(c *gin.Context) {
		licenseID := c.Param("id")
		count, _ := s.api.TrackerCount(licenseID)
		c.JSON(http.StatusOK, count)
	})

	gapi.GET("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		tracker := s.api.Tracker(trackerID)
		if tracker == nil {
			http.NotFound(c.Writer, c.Request)
			return
		}
		c.JSON(http.StatusOK, tracker)
	})

	gapi.PUT("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		tracker := s.api.Tracker(trackerID)
		if tracker == nil {
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

		expiration := c.Query("expiration")
		if expiration != "" {
			if expiration != "null" {
				date, err := strconv.Atoi(expiration)
				if err != nil {
					c.String(http.StatusBadRequest, "Invalid expiration")
					return
				}

				t := time.Unix(int64(date), 0)
				tracker.Expiration = &t
			} else {
				tracker.Expiration = nil
			}
		}

		if err := s.api.db.Save(&tracker).Error; err != nil {
			internalError(c, err)
			return
		}

		c.JSON(http.StatusOK, tracker)
	})

	gapi.DELETE("/trackers/:id", func(c *gin.Context) {
		trackerID := c.Param("id")
		tracker := s.api.Tracker(trackerID)
		if tracker == nil {
			http.NotFound(c.Writer, c.Request)
			return
		}

		err := s.api.DeleteTracker(trackerID)
		if err != nil {
			internalError(c, err)
			return
		}

		c.Status(http.StatusOK)
	})

	gapi.GET("/validations/activity", func(ctx *gin.Context) {
		switch ctx.Query("type") {
		case "license":
			id := ctx.Query("licenseId")
			result, err := s.api.ValidationLisenceActivity(id)
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, &result)
		case "licenses":
			result, err := s.api.ValidationLisencesActivity()
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, result)
		case "tracker":
			trackerId := ctx.Query("trackerId")
			result, err := s.api.ValidationTrackerActivity(trackerId)
			if err != nil {
				internalError(ctx, err)
				return
			}

			ctx.JSON(http.StatusOK, result)
		default:
			result, err := s.api.ValidationActivity()
			if err != nil {
				internalError(ctx, err)
				return
			}
			ctx.JSON(http.StatusOK, result)
		}
	})

	gapi.GET("/validations/count", func(ctx *gin.Context) {
		licenseId := ctx.Query("licenseId")
		trackerId := ctx.Query("trackerId")
		count, _ := s.api.ValidationCount(licenseId, trackerId)
		ctx.JSON(http.StatusOK, count)
	})

	gapi.GET("/validations", func(ctx *gin.Context) {
		var err error
		ops := ValidationsOptions{}
		pageStr := ctx.Query("page")
		if pageStr != "" {
			ops.Page, err = strconv.Atoi(pageStr)
			if err != nil || ops.Page < 0 {
				ctx.String(http.StatusBadRequest, "Invalid page value")
				return
			}
		}

		pageSizeStr := ctx.Query("pageSize")
		if pageSizeStr != "" {
			ops.PageSize, err = strconv.Atoi(pageSizeStr)
			if err != nil || ops.PageSize < 0 {
				ctx.String(http.StatusBadRequest, "Invalid pageSize value")
				return
			}
		}

		validations, _ := s.api.Validations(ops)
		ctx.JSON(http.StatusOK, validations)
	})

	gauth.POST("/register", func(ctx *gin.Context) {
		var req struct {
			Username  string `json:"username"`
			Password  string `json:"password"`
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		if err := ctx.BindJSON(&req); err != nil {
			http.Error(ctx.Writer, "Invalid request", http.StatusBadRequest)
			return
		}

		user, err := s.api.RegisterUser(req.Username, req.Password, req.FirstName, req.LastName)
		if err != nil {
			ctx.String(http.StatusBadRequest, "Invalid registration")
			return
		}

		ctx.JSON(http.StatusCreated, user)
	})

	gauth.POST("/login", func(ctx *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if ctx.BindJSON(&req) != nil {
			return
		}

		session, err := s.api.Login(req.Username, req.Password)
		if err != nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		http.SetCookie(ctx.Writer, &http.Cookie{
			Name:     "session_token",
			Value:    session.Token,
			Expires:  session.Expires,
			HttpOnly: true,
			Secure:   false, // Use true in production with HTTPS
			SameSite: http.SameSiteStrictMode,
			Path:     "/",
		})

		ctx.Status(http.StatusOK)
	})

	gauth.POST("/logout", func(ctx *gin.Context) {
		authMiddleware(ctx)
		principal := extractPrincipal(ctx)
		if principal.Type == ServicePrincipal {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		session := principal.UnwrapSession()
		s.api.Logout(session)
		ctx.SetCookie("session_token", "", -1, "/", "", false, true)
	})

	gapi.GET("/session", func(ctx *gin.Context) {
		principal := extractPrincipal(ctx)
		if principal.Type == ServicePrincipal {
			ctx.Status(http.StatusUnauthorized)
			return
		}
		session := principal.UnwrapSession()
		ctx.JSON(http.StatusOK, session)
	})

	gapi.PUT("/profile", func(c *gin.Context) {
		var req struct {
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		if err := c.BindJSON(&req); err != nil {
			http.Error(c.Writer, "Invalid request", http.StatusBadRequest)
			return
		}

		principal := extractPrincipal(c)
		if principal.Type == ServicePrincipal {
			c.Status(http.StatusUnauthorized)
			return
		}

		session := principal.UnwrapSession()
		session.User.FirstName = req.FirstName
		session.User.LastName = req.LastName
		if err := s.api.db.Save(session.User).Error; err != nil {
			internalError(c, err)
			return
		}

		c.Status(http.StatusOK)
	})

	g.POST("/api/activate", func(ctx *gin.Context) {
		var sig licensify.Signature
		if err := ctx.ShouldBindJSON(&sig); err != nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		kp := s.api.KeyPair()
		pub, err := licensify.LoadPublicKeyBase64(kp.PublicKey)
		if err != nil {
			internalError(ctx, err)
			return
		}

		if err := licensify.NewVerifier(pub).Verify(&sig); err != nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		trackerId := sig.License["tracker"]
		if trackerId == "" {
			ctx.String(http.StatusBadRequest, "No tracker in signature")
			return
		}

		err = s.api.ActivateTracker(trackerId.(string))
		if err != nil {
			ctx.String(http.StatusInternalServerError, "Tracker not available")
			return
		}

		ctx.Status(http.StatusOK)
	})

	g.POST("/api/validate", func(ctx *gin.Context) {
		if s.api.Validate(ctx) != nil {
			ctx.Status(http.StatusUnauthorized)
		} else {
			ctx.Status(http.StatusOK)
		}
	})

	gapi.POST("/client", func(ctx *gin.Context) {
		client, err := s.api.SetClient()
		if err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, client)
	})

	gapi.GET("/client", func(ctx *gin.Context) {
		client := s.api.Client()
		if client != nil {
			ctx.JSON(http.StatusOK, client)
		} else {
			ctx.JSON(http.StatusOK, gin.H{})
		}
	})

	gapi.GET("/keys", func(ctx *gin.Context) {
		kp := s.api.KeyPair()
		ctx.JSON(http.StatusOK, &kp)
	})

	gapi.POST("/keys", func(ctx *gin.Context) {
		pub, err := ctx.FormFile("publicKey")
		priv, err2 := ctx.FormFile("privateKey")
		if err != nil || err2 != nil {
			ctx.String(http.StatusBadRequest, "Invalid keys")
			return
		}

		if _, err := s.api.SetKeyPairFiles(pub, priv); err != nil {
			ctx.String(http.StatusBadRequest, "Invalid files")
			return
		}
	})

	g.NoRoute(func(ctx *gin.Context) {
		log.Println(ctx.Request.URL.Path)
		dir := http.Dir("client/out")
		_, err := os.Stat(filepath.Join("client", "out", ctx.Request.URL.Path+".html"))
		if err == nil {
			ctx.Request.URL.Path = ctx.Request.URL.Path + ".html"
		}
		http.FileServer(dir).ServeHTTP(ctx.Writer, ctx.Request)
	})
}
