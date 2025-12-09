# Contributing to Unified Mempool Monitoring System

Thank you for your interest in contributing to the Unified Mempool Monitoring System! We welcome contributions from the community and appreciate your help in making this project better.

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Git
- Docker (optional, for containerized development)
- Node.js (for frontend development, if applicable)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/unified-mempool-system.git
   cd unified-mempool-system
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -e ".[dev,test]"
   ```

4. **Install pre-commit hooks**
   ```bash
   pre-commit install
   ```

5. **Run tests to ensure everything works**
   ```bash
   pytest tests/ -v
   ```

## 📋 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports**: Report bugs and issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests with code changes
- **Documentation**: Improve documentation and examples
- **Testing**: Add or improve tests
- **Performance**: Optimize performance and reduce resource usage

### Reporting Issues

When reporting issues, please include:

1. **Clear description** of the problem
2. **Steps to reproduce** the issue
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, Python version, etc.)
5. **Logs and error messages** (if applicable)
6. **Screenshots** (if applicable)

### Submitting Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed
   - Follow the existing code style

3. **Run tests and linting**
   ```bash
   pytest tests/ -v
   black src/ tests/
   flake8 src/ tests/
   mypy src/
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Development Guidelines

### Code Style

We use the following tools for code formatting and linting:

- **Black**: Code formatting
- **Flake8**: Linting
- **MyPy**: Type checking
- **Pre-commit**: Git hooks for quality checks

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add new endpoint for transaction filtering
fix(engine): resolve memory leak in transaction processing
docs: update installation instructions
```

### Testing

- Write tests for all new functionality
- Maintain or improve test coverage
- Use descriptive test names
- Test both success and failure cases
- Include integration tests for complex features

### Documentation

- Update README.md for significant changes
- Add docstrings to all public functions and classes
- Update API documentation for new endpoints
- Include examples for new features

## 🏗️ Architecture Guidelines

### Project Structure

```
src/unified_mempool/
├── __init__.py
├── cli.py                 # Command line interface
├── core/                  # Core engine components
│   ├── __init__.py
│   └── unified_mempool_engine.py
├── api/                   # API gateway and endpoints
│   ├── __init__.py
│   └── unified_api_gateway.py
├── services/              # Service modules
│   └── __init__.py
├── utils/                 # Utility functions
│   └── __init__.py
└── models/                # Data models and schemas
    └── __init__.py
```

### Design Principles

1. **Modularity**: Keep components loosely coupled
2. **Testability**: Write testable code with clear interfaces
3. **Performance**: Optimize for speed and memory usage
4. **Security**: Follow security best practices
5. **Scalability**: Design for horizontal scaling
6. **Maintainability**: Write clean, readable code

## 🔒 Security

### Security Guidelines

- Never commit secrets, API keys, or sensitive data
- Use environment variables for configuration
- Validate all inputs and sanitize outputs
- Follow OWASP security guidelines
- Report security vulnerabilities privately

### Reporting Security Issues

For security vulnerabilities, please email us at security@scorpius.ai instead of creating a public issue.

## 📚 Resources

### Documentation

- [API Documentation](docs/api-reference.md)
- [Configuration Guide](docs/configuration.md)
- [Deployment Guide](docs/deployment.md)
- [Architecture Overview](docs/architecture.md)

### Community

- [GitHub Discussions](https://github.com/scorpius/unified-mempool-system/discussions)
- [Discord Community](https://discord.gg/scorpius)
- [Issues](https://github.com/scorpius/unified-mempool-system/issues)

## 🎉 Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community acknowledgments

## 📞 Support

If you need help with contributing:

- Check existing issues and discussions
- Join our Discord community
- Email us at support@scorpius.ai

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Unified Mempool Monitoring System! 🚀