package server

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Server struct {
	port string

	bypassAuth bool
	api        *API
}

func NewServer(port, dsn, pub, priv string, bypassAuth bool) *Server {
	api := newAPI(dsn)

	kp := api.KeyPair()
	if kp == nil {
		api.SetKeyPair(pub, priv)
	}

	return &Server{
		port:       port,
		api:        api,
		bypassAuth: bypassAuth,
	}
}

func (s *Server) Start() {
	g := gin.Default()
	s.setup(g)
	g.Run(fmt.Sprintf(":%s", s.port))
}

func internalError(c *gin.Context, err error) {
	code := fmt.Sprintf("ERR-%d-%d", time.Now().UnixNano(), rand.Intn(1000))
	c.Error(fmt.Errorf("%s - %v", code, err))
	c.JSON(http.StatusInternalServerError, gin.H{"error": code})
}
