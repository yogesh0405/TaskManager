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

    stage('Archive') {
      steps {
        archiveArtifacts artifacts: '**/*', excludes: '**/node_modules/**', fingerprint: true
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
