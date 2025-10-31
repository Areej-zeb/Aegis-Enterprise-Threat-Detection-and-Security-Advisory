# Contributing to Aegis IDS

Thank you for your interest in contributing to Aegis! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/aegis.git
cd aegis
```

### 2. Set Up Development Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r backend/ids/requirements.txt
pip install streamlit requests plotly

# Install development tools
pip install black isort flake8 pytest pre-commit
```

### 3. Configure Git Remotes

```bash
# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/aegis.git

# Verify remotes
git remote -v
```

---

## 💻 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clear, concise commit messages
- Keep commits atomic (one logical change per commit)
- Test your changes thoroughly

### 3. Code Quality

```bash
# Format code
black backend/
isort backend/

# Lint code
flake8 backend/

# Run tests
pytest tests/
```

### 4. Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add feature: your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Select your feature branch
- Fill out the PR template with details
- Link any related issues

---

## 📝 Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with some modifications:

- **Line length**: 88 characters (Black default)
- **Imports**: Organized using `isort`
- **Type hints**: Encouraged for function signatures
- **Docstrings**: Google-style docstrings for public functions

#### Example:

```python
from typing import List, Optional

def detect_threat(flow_data: dict, threshold: float = 0.75) -> Optional[dict]:
    """
    Detect potential threats in network flow data.
    
    Args:
        flow_data: Dictionary containing network flow features
        threshold: Confidence threshold for threat detection (default: 0.75)
        
    Returns:
        Dictionary with alert details if threat detected, None otherwise
        
    Raises:
        ValueError: If flow_data is missing required fields
    """
    # Implementation here
    pass
```

### File Organization

```
backend/
├── ids/
│   ├── serve/          # API endpoints
│   ├── models/         # ML models
│   ├── data_pipeline/  # Data processing
│   └── experiments/    # Research & evaluation
```

### Naming Conventions

- **Files**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions/Variables**: `snake_case`
- **Constants**: `UPPER_CASE`

---

## 🧪 Testing Guidelines

### Writing Tests

```python
# tests/test_simulate_flows.py
import pytest
from backend.ids.simulate_flows import random_flow

def test_random_flow_structure():
    """Test that random_flow generates valid alert structure."""
    alert = random_flow()
    
    assert "id" in alert
    assert "src_ip" in alert
    assert "dst_ip" in alert
    assert "label" in alert
    assert 0 <= alert["score"] <= 1
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest tests/test_simulate_flows.py
```

---

## 📤 Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines (Black, isort, flake8)
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No merge conflicts with main branch

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: CI/CD runs linting and tests
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, PR will be merged

---

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows 11 / Ubuntu 22.04 / macOS 13
- Python version: 3.11.2
- Aegis version: 0.2.0

**Screenshots**
If applicable
```

### Feature Requests

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How would you solve it?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

---

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `wontfix`: Won't be worked on

---

## 💡 Development Tips

### Local Testing

```bash
# Test backend only
uvicorn backend.ids.serve.app:app --reload

# Test dashboard only
cd frontend_streamlit
streamlit run app.py

# Test with Docker
docker-compose -f ops/docker-compose.dev.yml up --build
```

### Debugging

```python
# Add logging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug(f"Processing flow: {flow_data}")
```

### Performance Profiling

```python
import time

start = time.time()
# Your code here
print(f"Execution time: {time.time() - start:.2f}s")
```

---

## 🎓 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Streamlit Documentation](https://docs.streamlit.io/)
- [Python Testing with pytest](https://docs.pytest.org/)
- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 📧 Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and features
- **Email**: your.email@example.com

---

Thank you for contributing to Aegis! 🛡️
