# AWS Pricing Calculator

A comprehensive system for calculating and estimating AWS service costs with precision and accuracy.

## About This Project

Managing AWS infrastructure costs can be complex and challenging. AWS pricing varies by region, usage patterns, and service configurations, making it difficult to accurately predict expenses. This project was built to solve that problem by providing a **precise, transparent pricing calculator** that covers all major AWS services.

Whether you're:
- Planning your cloud infrastructure
- Estimating costs for different configurations
- Optimizing your AWS spend
- Understanding how pricing works across services

This calculator gives you accurate, formula-based cost estimations before you deploy.

## Overview

This project provides an advanced pricing calculation engine for AWS services including:
- **S3** (Simple Storage Service)
- **Lambda** (Serverless Compute)
- **DynamoDB** (NoSQL Database)
- **API Gateway** (API Management)
- **Elastic Load Balancer** (ALB, NLB, GWLB, CLB)
- **Elastic Beanstalk** (Managed Platform)
- **Cognito** (Authentication & Authorization)

## Demo Video

Check out the demo for a complete walkthrough of the system and its features:
- **[View Demo on Google Drive](https://drive.google.com/file/d/135yi-1-oqn24I5IpGFindn2OjHdlB5gT/view?usp=sharing)**

## Important Notice

**This project is under active development and continuous improvement.** Features, calculations, and interfaces are subject to change. Please refer to the latest version for the most accurate pricing formulas and functionality.

## Pricing Formulas

All pricing calculation logic is documented in **[FORMULAE.md](./FORMULAE.md)** - a detailed reference guide covering:
- Base pricing tier model
- Per-service calculation formulas
- Free tier applications
- Key constants and multipliers
- Rounding conventions

**Refer to FORMULAE.md for:**
- Exact calculation algorithms
- Parameter definitions
- Free tier savings logic
- Service-specific pricing tiers

## Getting Started

### Prerequisites
- Python 3.x (for backend)
- Node.js/npm (for frontend)

### Installation

1. **Backend Setup:**
   ```bash
   cd backend
   # Follow backend-specific instructions
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   # Follow frontend-specific instructions
   ```

## Documentation

- **[FORMULAE.md](./FORMULAE.md)** - Complete pricing calculation formulas and logic
- **[guide/](./guide/)** - Additional documentation and user guides
- **[demo.mp4](./demo.mp4)** - Visual demonstration of features

## Roadmap & Improvements

This project is continuously evolving with planned improvements including:
- Additional AWS services
- Enhanced calculation accuracy
- Improved UI/UX
- Better performance optimization
- Extended free tier support
- Regional pricing variations

*Stay tuned for updates!*

---

**Last Updated:** April 26, 2026

**Status:** 🚧 Under Active Development
