# Contributing to Scarlette AI Service

Thank you for your interest in contributing to Scarlette AI Service! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or higher
- Git
- Docker (optional, for containerized development)
- Redis (for full functionality)

### Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/scarlette-ai-service.git
cd scarlette-ai-service
```

2. **Set up Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Development Dependencies**
```bash
make install-dev
# OR manually:
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install -e .
```

4. **Set up Pre-commit Hooks**
```bash
pre-commit install
```

5. **Configure Environment**
```bash
make env-copy
# Edit .env with your settings
```

6. **Start Redis (if needed)**
```bash
make redis-start
# OR use Docker Compose:
docker-compose -f docker-compose.dev.yml up redis
```

## 🏗️ Development Workflow

### Code Style
We use several tools to maintain code quality:

- **Black** for code formatting
- **isort** for import sorting  
- **flake8** for linting
- **mypy** for type checking

Run all formatting and checks:
```bash
make format  # Format code
make lint    # Run all linting tools
```

### Testing
We have comprehensive test coverage with different test types:

```bash
make test              # Run all tests
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make test-coverage     # With coverage report
```

### Running the Service
```bash
make serve     # Development server with reload
make serve-prod # Production-like server
```

### Docker Development
```bash
make docker-run-dev  # Full development environment
make docker-logs     # View logs
make docker-stop     # Stop containers
```

## 📝 Contribution Guidelines

### Types of Contributions
- 🐛 **Bug fixes**
- ✨ **New features**  
- 📚 **Documentation improvements**
- 🧪 **Test improvements**
- 🔧 **DevOps and tooling**
- 🎨 **UI/UX improvements**

### Making Changes

1. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
git checkout -b bugfix/issue-description
git checkout -b docs/section-improvement
```

2. **Make Your Changes**
- Write clean, well-documented code
- Add tests for new functionality
- Update documentation as needed
- Follow existing code patterns

3. **Test Your Changes**
```bash
make test
make lint
make security-scan
```

4. **Commit Your Changes**
Use conventional commit messages:
```bash
git commit -m "feat: add smart contract vulnerability scanner"
git commit -m "fix: resolve Redis connection timeout issue"
git commit -m "docs: update API documentation"
git commit -m "test: add integration tests for chat endpoint"
```

5. **Push and Create Pull Request**
```bash
git push origin feature/your-feature-name
```

### Pull Request Process

1. **Ensure CI Passes**
   - All tests pass
   - Code coverage meets requirements (>80%)
   - Linting passes
   - Security scans pass

2. **Write Good PR Description**
   - Describe what changes were made
   - Explain why the changes are needed
   - Link to related issues
   - Include screenshots for UI changes

3. **Request Review**
   - Tag relevant reviewers
   - Be responsive to feedback
   - Make requested changes promptly

## 🧪 Testing Guidelines

### Test Structure
```
tests/
├── unit/           # Fast, isolated tests
├── integration/    # Component interaction tests
└── conftest.py     # Shared fixtures
```

### Writing Tests
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions

Example:
```python
def test_chat_endpoint_returns_ai_response(client, mock_ai):
    # Arrange
    request_data = {"message": "Test message", "user_id": "test"}
    expected_response = {"response": "AI response", "confidence": 0.9}
    mock_ai.process_message.return_value = expected_response
    
    # Act
    response = client.post("/chat", json=request_data)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["response"] == "AI response"
```

### Test Categories
Use pytest markers to categorize tests:
- `@pytest.mark.unit` - Fast unit tests
- `@pytest.mark.integration` - Integration tests  
- `@pytest.mark.slow` - Slow-running tests
- `@pytest.mark.ai` - Tests requiring AI models

## 📚 Documentation

### Types of Documentation
- **Code Comments** - For complex logic
- **Docstrings** - For all public functions/classes
- **API Documentation** - OpenAPI/Swagger specs
- **README** - Project overview and quick start
- **Guides** - Detailed how-to documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Test documentation examples

## 🔒 Security Guidelines

### Security Best Practices
- Never commit secrets or credentials
- Sanitize user inputs
- Use parameterized queries
- Implement proper authentication
- Keep dependencies updated

### Security Testing
```bash
make security-scan  # Run security checks
bandit -r src/      # Python security linter
safety check        # Check for known vulnerabilities
```

## 🐛 Bug Reports

When reporting bugs, please include:
- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Environment details** (OS, Python version, etc.)
- **Logs or error messages**
- **Minimal code example** if applicable

## ✨ Feature Requests

For feature requests, please provide:
- **Clear description** of the feature
- **Use case** and motivation
- **Proposed implementation** (if you have ideas)
- **Alternative solutions** considered

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Discord** - Real-time chat with the community
- **Email** - team@scarlette-ai.com for sensitive issues

## 🎯 Development Roadmap

### Current Focus Areas
- Enhanced AI model integration
- Multi-chain blockchain support
- Advanced security scanning
- Performance optimization
- Documentation improvements

### Future Plans
- Voice interaction capabilities
- Advanced threat prediction
- Enterprise integrations
- Mobile application
- Community plugins

## 🏷️ Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated  
- [ ] Version bumped
- [ ] Security scan clean
- [ ] Performance benchmarks stable

## 🤝 Community Guidelines

### Code of Conduct
- **Be respectful** and inclusive
- **Help newcomers** learn and contribute
- **Provide constructive feedback**
- **Focus on the code**, not the person
- **Respect different perspectives**

### Communication
- Use clear, professional language
- Be patient with questions
- Provide helpful, detailed responses
- Credit others for their contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to Scarlette AI Service! 🚀**