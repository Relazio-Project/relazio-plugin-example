# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-20

### Added
- Initial release of Relazio Plugin Example
- IP Lookup transform (synchronous)
- Deep IP Scan transform (asynchronous)
- HMAC webhook signature implementation
- Express server with health check
- Manifest.json generator
- Docker and docker-compose support
- systemd service configuration
- Comprehensive documentation
- Development and testing utilities

### Features
- ✅ Synchronous transforms (< 30s)
- ✅ Asynchronous transforms with webhook callbacks
- ✅ HMAC-SHA256 signature verification
- ✅ Job progress tracking
- ✅ Manifest validation
- ✅ Error handling
- ✅ TypeScript support
- ✅ Hot reload in development

### Documentation
- README.md with quick start guide
- DEVELOPMENT.md with detailed development workflow
- Inline code documentation
- Example API calls

### Security
- HMAC signature for webhook authentication
- Environment variable configuration
- No hardcoded secrets
- Timing-safe signature comparison

---

## Future Versions

### [1.1.0] - Planned

#### Planned Features
- Redis for job storage (instead of in-memory)
- Rate limiting middleware
- More detailed logging with winston
- Prometheus metrics endpoint
- Additional transform examples (domain, email)
- Automated tests with vitest
- GitHub Actions CI/CD

#### Improvements
- Better error messages
- Configurable timeouts
- Retry logic for webhook delivery
- Job cleanup (TTL)

---

*"Rivela le connessioni nascoste"* - Relazio Team

