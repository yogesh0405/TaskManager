pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        script {
          if (fileExists('package.json')) {
            sh 'echo "package.json found — installing dependencies"'
            sh 'npm ci'
          } else {
            sh 'echo "No package.json — skipping install"'
          }
        }
      }
    }

    stage('Build') {
      steps {
        script {
          if (fileExists('package.json')) {
            sh 'if npm run | grep -q "build"; then npm run build; else echo "No npm build script defined"; fi'
          } else {
            sh 'echo "Static site — no build step required"'
          }
        }
      }
    }

    stage('Test') {
      steps {
        script {
          if (fileExists('package.json')) {
            sh 'npm test'
            junit allowEmptyResults: true, testResults: 'test-results/*.xml'
          } else {
            sh 'echo "No package.json — skipping test execution"'
          }
        }
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'test-results/*.json, test-results/*.xml, **/*', excludes: '**/node_modules/**', fingerprint: true
      }
    }
  }

  post {
    success {
      echo 'Jenkins pipeline completed successfully.'
    }
    failure {
      echo 'Jenkins pipeline failed.'
    }
  }
}
