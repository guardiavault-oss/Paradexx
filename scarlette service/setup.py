"""Setup configuration for Scarlette AI Service."""

from pathlib import Path

from setuptools import find_packages, setup

# Read the contents of README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

# Read requirements
requirements = []
with open("requirements.txt") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

# Read dev requirements
dev_requirements = []
with open("requirements-dev.txt") as f:
    dev_requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="scarlette-ai-service",
    version="1.0.0",
    author="Scarlette AI Team",
    author_email="team@scarlette-ai.com",
    description="Advanced Blockchain Security AI Assistant",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-org/scarlette-ai-service",
    project_urls={
        "Documentation": "https://docs.scarlette-ai.com",
        "Source": "https://github.com/your-org/scarlette-ai-service",
        "Bug Tracker": "https://github.com/your-org/scarlette-ai-service/issues",
    },
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Internet :: WWW/HTTP :: HTTP Servers",
        "Topic :: Security :: Cryptography",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    extras_require={
        "dev": dev_requirements,
        "ai": [
            "openai>=1.3.7,<2.0.0",
            "transformers>=4.35.2,<5.0.0",
            "torch>=2.1.1,<3.0.0",
            "accelerate>=0.24.1",
            "sentencepiece>=0.1.99",
        ],
        "blockchain": [
            "web3>=6.11.3",
            "eth-account>=0.9.0",
            "eth-utils>=2.2.0",
        ],
        "analytics": [
            "numpy>=1.24.3",
            "pandas>=2.1.4",
        ],
        "all": [
            "openai>=1.3.7,<2.0.0",
            "transformers>=4.35.2,<5.0.0",
            "torch>=2.1.1,<3.0.0",
            "accelerate>=0.24.1",
            "sentencepiece>=0.1.99",
            "web3>=6.11.3",
            "eth-account>=0.9.0",
            "eth-utils>=2.2.0",
            "numpy>=1.24.3",
            "pandas>=2.1.4",
        ],
    },
    entry_points={
        "console_scripts": [
            "scarlette-ai=scarlette_ai.main:main",
            "scarlette=scarlette_ai.cli:cli",
        ],
    },
    include_package_data=True,
    zip_safe=False,
    keywords=[
        "ai",
        "blockchain",
        "security",
        "defi",
        "smart-contracts",
        "cryptocurrency",
        "vulnerability-scanner",
        "api",
        "fastapi",
    ],
)
