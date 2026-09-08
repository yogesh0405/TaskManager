# TaskManager
## CI with Jenkins

Follow these steps to build this project with Jenkins using the provided `Jenkinsfile`:

1. Install Jenkins and required plugins: `Pipeline`, `Git`, and (optionally) `NodeJS`.
2. Create a new Pipeline job and point it to this repository (SCM).
3. Use Pipeline script from SCM and set the branch and repository URL.
4. (Optional) If your project uses `npm`:
	- Install NodeJS on the Jenkins node or configure the `NodeJS` tool in Jenkins global tools.
	- Ensure a `package.json` with a `build` script exists; the pipeline runs `npm ci` and `npm run build` if present.
5. Save and run the pipeline. The pipeline will:
	- Checkout the repository
	- Install dependencies (if `package.json` exists)
	- Run the `build` script (if present)
	- Archive the workspace artifacts for retrieval
6. (Optional) Configure a webhook in your Git host to trigger the pipeline on pushes.

Files added:
- `Jenkinsfile` — Declarative pipeline at repository root.

# Student Task Manager

A simple web-based application designed to help students manage their daily tasks efficiently.
Students can create, update, delete, and track their tasks in one place.
The project provides an easy-to-use interface for better task organization.
Tasks can be categorized based on their priority or status.
Users can mark tasks as completed once they finish them.
The application helps students stay organized and manage deadlines effectively.
It is built using modern web development technologies.
The project is suitable for learning and practicing software development concepts.
Future improvements may include reminders, notifications, and user authentication.

modiefied readme