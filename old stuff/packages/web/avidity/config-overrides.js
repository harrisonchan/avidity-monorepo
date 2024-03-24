//Overrides rrule's sourcemap generation warnings...I'm dead
module.export = function override(config) {
    return {
        ...config,
        ignoreWarnings: [
            {
                message: /source-map-loader/,
                module: /node_modules\/rrule/,
            }
        ],
    }
}