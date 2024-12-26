#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for different environments
const config = {
    staging: {
        registry: 'https://npm.pkg.github.com',
        tag: 'beta',
        prerelease: true
    },
    production: {
        registry: 'https://registry.npmjs.org',
        tag: 'latest',
        prerelease: false
    }
};

// Get environment from command line argument
const environment = process.argv[2];

if (!environment || !config[environment]) {
    console.error('Please specify a valid environment (staging or production)');
    process.exit(1);
}

// Get package version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
const version = packageJson.version;

try {
    console.log(`Starting deployment to ${environment}...`);

    // Run tests
    console.log('Running tests...');
    execSync('npm run test', { stdio: 'inherit' });

    // Run smoke tests
    console.log('Running smoke tests...');
    execSync('npm run test:smoke', { stdio: 'inherit' });

    // Build the package
    console.log('Building package...');
    execSync('npm run build', { stdio: 'inherit' });

    // Tag the version
    const tag = config[environment].tag;
    console.log(`Tagging version ${version} as ${tag}...`);
    execSync(`npm dist-tag add ${packageJson.name}@${version} ${tag}`, { stdio: 'inherit' });

    // Publish to the appropriate registry
    console.log(`Publishing to ${config[environment].registry}...`);
    execSync(`npm publish --registry ${config[environment].registry}${config[environment].prerelease ? ' --tag beta' : ''}`, {
        stdio: 'inherit'
    });

    // Create a deployment record
    const deploymentRecord = {
        version,
        environment,
        timestamp: new Date().toISOString(),
        commit: execSync('git rev-parse HEAD').toString().trim()
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
        path.join(deploymentsDir, `${environment}-${version}.json`),
        JSON.stringify(deploymentRecord, null, 2)
    );

    console.log(`Successfully deployed version ${version} to ${environment}`);
} catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
}