const nodeExternals = require("webpack-node-externals");
module.exports={
    entry:"./index.js",
    target: 'node',
    // When uploading to arweave use the production mode
    // mode:"production",
    mode: "development",
    externalsPresets: { node: true },   // <-- here
    externals: [nodeExternals()],       // <-- and here
    devtool: 'source-map',
    optimization: {
        usedExports: false, // <- no remove unused function
    },
    stats:{
      moduleTrace:false
    },
    node:{
      __dirname: true
    }
}