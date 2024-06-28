# Vault2Swarm
[![Docker](https://img.shields.io/docker/pulls/theevolk/vault2swarm)](https://hub.docker.com/r/theevolk/vault2swarm)

Vault2Swarm is a Node.js application designed to synchronize secrets from HashiCorp Vault to Docker Swarm services. The application periodically checks for services with specific labels and updates their environment variables with secrets from Vault.

## Installation

### Prerequisites
- **Docker**
- **Docker Swarm Mode** enabled
- **HashiCorp Vault**

### Running
    ```bash
    docker run -d \
        -e VAULT_ENDPOINT=https://vault.example.com \
        -e VAULT_TOKEN=myvaulttoken \
        -e DOCKER_OPTIONS='{"socketPath":"/var/run/docker.sock"}' \
        -e INTERVAL=60 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        --name vault2swarm \
        vault2swarm:latest
    ```

### Environment Variables

| Variable           | Description                                      | Default                        |
|--------------------|--------------------------------------------------|--------------------------------|
| `VAULT_ENDPOINT`   | URL of the HashiCorp Vault instance              | `https://127.0.0.1:8200`       |
| `VAULT_TOKEN`      | Token to authenticate with Vault                 | None                           |
| `VAULT_TOKEN_FILE` | Path to a file containing the Vault token        | None                           |
| `DOCKER_OPTIONS`   | Options for Docker connection (JSON format)      | `{"socketPath":"/var/run/docker.sock"}` |
| `INTERVAL`         | Interval in seconds for checking services        | `60`                           |

### Application Labels

To use Vault2Swarm, label your Docker Swarm services with the following format:

- `vault2swarm:<secret-path>:<secret-key>=<target-env>`: Specifies the secret path and key within Vault.
  
Examples:

- `vault2swarm:secret/data/myapp:password=MYAPP_PASSWORD`: Fetches the `password` key from the `secret/data/myapp` path in Vault and create environment variable `MYAPP_PASSWORD`.

## License

This project is licensed under the MIT License.
