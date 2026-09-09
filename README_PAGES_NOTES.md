GitHub Pages configuration notes:

- This workflow builds the project and publishes the output directory `./dist` to the `gh-pages` branch.
- If your frontend build outputs to a different folder (e.g., ./build or frontend/build), update `publish_dir` in .github/workflows/deploy-frontend.yml accordingly.
- After the first successful run, enable GitHub Pages in the repository settings (if not auto-enabled):
    Settings -> Pages -> Source: gh-pages branch
- The site will be available at: https://hemaqas998-eng.github.io/pal.c88/
