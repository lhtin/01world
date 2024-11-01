#!/bin/bash

set -e
set -u
set -x
set -o pipefail

# ohmyzsh, zsh-autosuggestions, zsh-syntax-highlighting
if [ -d "~/.oh-my-zsh" ]; then
  mv ~/.oh-my-zsh ~/.oh-my-zsh-bak
fi
sh -c "$(curl -fsSL https://install.ohmyz.sh/)" "" --unattended
git clone https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
sed -i -E "s/plugins=\(git\)/plugins=\(git zsh-autosuggestions zsh-syntax-highlighting\)/" ~/.zshrc
