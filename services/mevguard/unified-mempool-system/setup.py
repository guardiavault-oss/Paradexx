#!/usr/bin/env python3
"""
Setup script for Unified Mempool Monitoring System
"""


from setuptools import find_packages, setup


# Read the README file
def read_readme():
    with open("README.md", encoding="utf-8") as fh:
        return fh.read()


# Read requirements
def read_requirements():
    with open("requirements.txt", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]


setup(
    name="unified-mempool-system",
    version="1.0.0",
    author="Scorpius Team",
    author_email="support@scorpius.ai",
    description="World-class mempool monitoring system consolidating 11 different services into a unified, real-time, synchronized monitoring platform",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/scorpius/unified-mempool-system",
    project_urls={
        "Bug Reports": "https://github.com/scorpius/unified-mempool-system/issues",
        "Source": "https://github.com/scorpius/unified-mempool-system",
        "Documentation": "https://unified-mempool-system.readthedocs.io",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Office/Business :: Financial",
        "Topic :: Security",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Monitoring",
    ],
    python_requires=">=3.11",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "black>=23.11.0",
            "flake8>=6.1.0",
            "mypy>=1.7.1",
            "pre-commit>=3.6.0",
        ],
        "test": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
        ],
        "docs": [
            "mkdocs>=1.5.3",
            "mkdocs-material>=9.4.8",
            "mkdocstrings[python]>=0.24.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "unified-mempool=unified_mempool.cli:main",
            "mempool-monitor=unified_mempool.cli:monitor",
            "mempool-api=unified_mempool.cli:api",
        ],
    },
    include_package_data=True,
    package_data={
        "unified_mempool": [
            "config/*.yaml",
            "config/*.yml",
            "config/*.json",
            "*.sql",
        ],
    },
    zip_safe=False,
)
