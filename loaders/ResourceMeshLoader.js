const loader = require('./_common/fileLoader');

module.exports = class ResourceMeshLoader { 

    constructor(injectable){
        this.nodes = {};
        this.injectable = injectable;
    }

    load(){
        const files = loader('./mws/**/*.rnode.js');

        /** validate nodes */
       Object.values(files).forEach((node) => {

            if (!node || !node.basePath) {
                console.warn('Invalid rnode skipped');
                return;
            }

            this.nodes[node.basePath] = node;
        });

        return this.nodes;
    }
   
}