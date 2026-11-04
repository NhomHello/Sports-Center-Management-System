"""Compatibility entrypoint for current requirement prose; task reassignment is separate."""
from requirements_docs import build_rules, update_usecases, update_sprint4


def reconcile_rules():
    build_rules()


def reconcile_usecases():
    update_usecases()
    update_sprint4()


if __name__ == '__main__':
    reconcile_rules()
    reconcile_usecases()
