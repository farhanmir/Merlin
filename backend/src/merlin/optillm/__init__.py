# Version information
__version__ = "0.3.4"

# Note: Server imports are commented out to avoid Flask dependency
# when using OptiLLM techniques directly (not as a web server)
#
# If you need the Flask server, install Flask and uncomment below:
# from .server import (
#     main,
#     server_config,
#     app,
#     known_approaches,
#     plugin_approaches,
#     parse_combined_approach,
#     parse_conversation,
#     extract_optillm_approach,
#     get_config,
#     load_plugins,
#     count_reasoning_tokens,
#     parse_args,
#     execute_single_approach,
#     execute_combined_approaches,
#     execute_parallel_approaches,
#     generate_streaming_response,
# )

# List of exported symbols
__all__ = [
    # Server exports (commented out - Flask not required)
    # 'main',
    # 'server_config',
    # 'app',
    # 'known_approaches',
    # 'plugin_approaches',
    # 'parse_combined_approach',
    # 'parse_conversation',
    # 'extract_optillm_approach',
    # 'get_config',
    # 'load_plugins',
    # 'count_reasoning_tokens',
    # 'parse_args',
    # 'execute_single_approach',
    # 'execute_combined_approaches',
    # 'execute_parallel_approaches',
    # 'generate_streaming_response',
]
