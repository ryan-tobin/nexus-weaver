"""
Nexus Weaver CLI
Copyright (c) 2025 Nexus Weaver Project
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="nexus-weaver",
    version="0.1.0",
    author="Ryan Tobin",
    author_email="ryantobin119@gmail.com",
    description="CLI for the Nexus Weaver deployment platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ryan-tobin/nexus-weaver",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Build Tools",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
    install_requires=[
        "click>=8.1.0",
        "requests>=2.28.0",
        "pyyaml>=6.0",
        "rich>=13.0.0",
        "tabulate>=0.9.0",
        "python-dotenv>=1.0.0",
    ],
    extras_require = {
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "types-requests",
            "types-pyyaml",
        ]
    },
    entry_points={
        "console_scripts":[
            "weaver=weaver.cli:cli",
        ],
    },
)