#!/bin/bash
# 使い方: ./run.sh stage1|stage2|stage3 [ansible-playbook の引数]
set -euo pipefail
cd "$(dirname "$0")"
stage=${1:?usage: run.sh stage1|stage2|stage3}; shift
export ANSIBLE_ROLES_PATH="$PWD/../roles"
export ANSIBLE_CONFIG="$PWD/../ansible.cfg"
export ANSIBLE_HOST_KEY_CHECKING=False
exec ansible-playbook -i inventory.yml -e @vars.yml "stages/$stage.yml" "$@"
