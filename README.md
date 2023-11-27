# Download workflow artifact GitHub Action

An action that downloads and extracts the latest uploaded artifact by name.

## Usage

```yaml
- name: Download artifact
  id: download-artifact
  uses: gregarcara/action-download-artifact@main
  with:
    github_token: ${{secrets.GITHUB_TOKEN}}
    name: artifact_name
    path: extract_here
```
