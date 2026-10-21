
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

stage('Test') {
    steps {
        bat 'npm test'
    }
}


        stage('Archive Results') {
            steps {
                archiveArtifacts(
                    artifacts: 'test-results/**',
                    allowEmptyArchive: true
                )
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
