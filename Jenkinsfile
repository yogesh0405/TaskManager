
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
        bat 'echo ===== CURRENT WORKSPACE ====='
        bat 'cd'
        bat 'echo ===== INDEX FILE CHECK ====='
        bat 'if exist index.html (echo FOUND index.html) else (echo MISSING index.html)'
        bat 'dir /a index.html'
        bat 'echo ===== SERVER FILE CONTENT ====='
        bat 'type server.js'
        bat 'echo ===== GIT TRACKING ====='
        bat 'git ls-files index.html server.js test-runner.js'
        bat 'echo ===== RUN TESTS ====='
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
