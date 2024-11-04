FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

# Install Node.js and npm globally
ENV NODE_VERSION=20.x
ENV NPM_GLOBAL=/usr/local/share/npm-global
ENV PATH="${NPM_GLOBAL}/bin:${PATH}"

RUN mkdir -p ${NPM_GLOBAL} \
    && chown -R vscode:vscode ${NPM_GLOBAL} \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && npm config set prefix "${NPM_GLOBAL}"

# Install watchman
RUN apt-get update && \
    apt-get install -y watchman && \
    apt-get clean

# Create watchman directory for vscode user
RUN mkdir -p /home/vscode/.config/watchman && \
    chown -R vscode:vscode /home/vscode/.config/watchman

# Create a script to set inotify watches at container startup
RUN echo '#!/bin/bash\n\
echo "Setting inotify watches..."\n\
if [ -f /proc/sys/fs/inotify/max_user_watches ]; then\n\
    echo 524288 > /proc/sys/fs/inotify/max_user_watches || true\n\
fi\n\
if [ -f /proc/sys/fs/inotify/max_user_instances ]; then\n\
    echo 512 > /proc/sys/fs/inotify/max_user_instances || true\n\
fi\n\
echo "Inotify watch configuration complete"' > /usr/local/bin/configure-watches.sh && \
    chmod +x /usr/local/bin/configure-watches.sh

# Ensure proper permissions for npm global directory
RUN mkdir -p ${NPM_GLOBAL} && \
    chown -R vscode:vscode ${NPM_GLOBAL} && \
    chmod -R 775 ${NPM_GLOBAL}

# Verify installations
RUN echo "Node $(node --version)" && \
    echo "NPM $(npm --version)" && \
    echo "Python $(python --version)"
