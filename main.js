const core = require('@actions/core')
const github = require('@actions/github')
const artifact = require('@actions/artifact')
const AdmZip = require('adm-zip')
const filesize = require('filesize')
const pathname = require('path')
const fs = require('fs')

async function main() {
  try {
	const token = core.getInput("github_token", { required: true })
	const [owner, repo] = core.getInput("repo", { required: true }).split("/")	
	const name = core.getInput("name", { required: true})
	const path = core.getInput("path", { required: true })

	const client = github.getOctokit(token)

	core.info(`==> Repository: ${owner}/${repo}`)
	core.info(`==> Artifact name: ${name}`)
	core.info(`==> Local path: ${path}`)

	const artifacts = await client.rest.actions.listArtifactsForRepo({
	  owner,
	  repo,
	  name,
	})

	if(!artifacts || artifacts.total_count === 0) {
	  return setExitMessage("fail", "no downloadable artifacts found")
	}

	core.info(JSON.stringify(artifacts))

	artifact = artifacts.artifacts[0]

	try {
	  zip = await client.rest.actions.downloadArtifact({
		owner: owner,
		repo: repo,
		artifact_id: artifact.id,
		archive_format: "zip",
	  })
	} catch (error) {
	  if (error.message === "Artifact has expired") {
		return setExitMessage(ifNoArtifactFound, "no downloadable artifacts found (expired)")
	  } else {
		throw new Error(error.message)
	  }
	}

	const dir = path

	fs.mkdirSync(dir, { recursive: true })

	const adm = new AdmZip(Buffer.from(zip.data))

	core.startGroup(`==> Extracting: ${artifact.name}.zip`)
	adm.getEntries().forEach((entry) => {
	  const action = entry.isDirectory ? "creating" : "inflating"
	  const filepath = pathname.join(dir, entry.entryName)

	  core.info(`  ${action}: ${filepath}`)
	})

	adm.extractAllTo(dir, true)
	core.endGroup()
  } catch (error) {
	core.setOutput("found_artifact", false)
	core.setOutput("error_message", error.message)
	core.setFailed(error.message)
  }

  function setExitMessage(ifNoArtifactFound, message) {
	core.setOutput("found_artifact", false)

	switch (ifNoArtifactFound) {
	  case "fail":
		core.setFailed(message)
		break
	  case "warn":
		core.warning(message)
		break
	  case "ignore":
	  default:
		core.info(message)
		break
	}
  }
}

main()
