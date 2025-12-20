# Contributing to Relazio Plugin Example

Thank you for your interest in contributing to this example plugin! This project serves as a reference implementation for creating external plugins for the Relazio platform.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/relazio-plugin-example.git
   cd relazio-plugin-example
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/my-feature
   ```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development instructions.

## Making Changes

### Code Style

- Use TypeScript for all code
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add new transform for domain lookup`
- `fix: correct HMAC signature verification`
- `docs: update README with deployment instructions`
- `refactor: simplify webhook sending logic`
- `test: add tests for async transforms`

### Testing

Before submitting a PR:

1. **Run tests**:
   ```bash
   npm test
   ```

2. **Validate manifest**:
   ```bash
   npm run validate-manifest
   ```

3. **Test HMAC**:
   ```bash
   npm run test-hmac
   ```

4. **Test manually** with Relazio platform

## Submitting Changes

1. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```

2. **Create a Pull Request** on GitHub

3. **Describe your changes**:
   - What does this PR do?
   - Why is this change needed?
   - How did you test it?
   - Screenshots (if applicable)

## Ideas for Contributions

### New Features

- Additional transform examples (domain, email, phone)
- Redis integration for job storage
- Rate limiting middleware
- Prometheus metrics
- Better logging with winston
- Retry logic for webhooks
- Job cleanup/TTL

### Documentation

- More detailed API documentation
- Video tutorial
- Deployment guides for different platforms
- Troubleshooting guide
- FAQ

### Testing

- Unit tests for transforms
- Integration tests with mock Relazio API
- E2E tests
- Load testing

### DevOps

- GitHub Actions CI/CD
- Terraform/Ansible deployment scripts
- Kubernetes manifests
- Monitoring dashboards

## Code of Conduct

Be respectful and constructive. This is a learning resource for the community.

## Questions?

Open an issue or discussion on GitHub!

---

**Thank you for contributing!** 🎉

*"Rivela le connessioni nascoste"* - Relazio Community

