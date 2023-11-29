const fs = require('fs');
const { WebApi, getPersonalAccessTokenHandler } = require("azure-devops-node-api");

const settings = JSON.parse(fs.readFileSync('src/settings.json', 'utf8'));

class ReleaseProvider {
  constructor(releaseApi, logger) {
    this.releaseApi = releaseApi;
    this.logger = logger;
  }

  async listDeployments(project, definitionId) {
    let continuationToken = 0;
    const top = 5;
    const deployments = []
    let hasMore = true;
    let requestCount = 0;

    let undefined;
    let response;

    while (hasMore) {
      try {
      response = await this.releaseApi.getDeployments({ 
        project, 
        definitionId, 
        nullz: 0,
        nullz: 0,
        nullz: 0,
        nullz: 0,
        nullz: 0,
        nullz: 0,
        nullz: 0,
        nullz: 0, 
        top,
        continuationToken
      });
      requestCount++;

      console.log(`response: ${JSON.stringify(response, null, 2)}`);
    } catch (err) {
      console.log(`err: ${err}`);
    }

      if (response && response.length > 0) {
        const mappedDeployments = response.map(deploymentData => ({
          id: deploymentData.id,
          completedOn: deploymentData.completedOn,
          stageDisplayName: deploymentData.releaseEnvironment.name,
          status: deploymentData.operationStatus,
        }));

        deployments.push(...mappedDeployments);

        if (response.length === 5) {
          continuationToken += 5;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`requestCount: ${requestCount}`);
    return deployments;
  }
}

class AzureDevOpsApiFactory {
  constructor(logger) {
    this.logger = logger;
  }

  async getApi(collectionUrl, accessToken) {
    return new WebApi(collectionUrl, getPersonalAccessTokenHandler(accessToken));
  }

  async getReleaseManager(collectionUrl, accessToken) {
    // const releaseApi = await this.getApi(collectionUrl, accessToken).getReleaseApi();
    const webApi = await this.getApi(collectionUrl, accessToken);
    const releaseApi = await webApi.getReleaseApi();
    return new ReleaseProvider(releaseApi, this.logger);
  }
}

(async () => {
  const logger = {};
  const factory = new AzureDevOpsApiFactory(logger);
  const releaseManager = await factory.getReleaseManager(settings.collectionUrl, settings.accessToken);

  const projectId = 'Webstaurantstore.com';
  const definitionId = 5;

  const deployments = await releaseManager.listDeployments(projectId, definitionId);

  // const mappedDeployments = deployments.map((data) => ({
  //   id: data.id,
  //   completedOn: data.completedOn,
  //   stageDisplayName: data.stageDisplayName.name,
  //   status: data.status
  // }));

  console.log(JSON.stringify(deployments, null, 2)); 

})();

