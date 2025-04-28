# MyWine Project Documentation

This directory contains documentation for the MyWine project.

## Contents

- [Branching Strategy](BRANCHING.md) - Guidelines for branch creation and management
- [Deployment Guide](DEPLOYMENT.md) - Instructions for deploying the application
- [Firebase Configuration](FIREBASE.md) - Details about Firebase setup and configuration
- [Cleanup Steps](CLEANUP_STEPS.md) - Steps for cleaning up the project structure

## Project Overview

MyWine is a web application that helps users analyze wine based on images and provides personalized recommendations. It uses:

- Next.js for the frontend
- Firebase for hosting, storage, and serverless functions
- OpenAI API for wine analysis and recommendations

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see [Firebase Configuration](FIREBASE.md))
4. Run the development server: `npm run dev`

## Development Workflow

1. Create a feature branch from `main` (see [Branching Strategy](BRANCHING.md))
2. Develop and test your changes
3. Create a pull request to `main`
4. After review and approval, merge the PR
5. Deploy to production (see [Deployment Guide](DEPLOYMENT.md))