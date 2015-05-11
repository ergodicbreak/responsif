var RifEngine = (function() {
    function loadRif(completion) {
        var self = this;
        this.load.loadTokens(this.rif_file, function (tokens) {
            rifExpand(tokens, function(tokens) {
                var rif = rifParse(tokens);
                self.world.addRif(rif);
                completion(rif);
            });
        });
    }
    function createInteract(rif) {
        return
    }
    function initFromParams(params) {
        var self = this;
        self.data_root = params.data_root || "data/";

        function loadFile(name, completion) {
            $.ajax({
                url: self.data_root + name
            }).done(completion);
        }

        self.rif_file = params.rif_file || "rif.txt";
        self.load_file = params.load_file || loadFile;
        self.load = params.load || new rifLoad(self.load_file);

        self.world = params.world || new RifWorld();
        self.response = params.response || new RifResponse(self.world);
        self.formatter = params.formatter || new RifHtmlFormatter();
        self.dom = params.dom || new RifDOM(params.element);

        loadRif.call(this, function(rif) {
            self.interact =  new RifInteract(self.dom, self.formatter, self.world, self.response, rif);
            self.interact.sendCommand(["START"]);
        });
    }
    var type = function(params) {
        initFromParams.call(this, params);
    };

    type.prototype.getWorld = function() {
        return this.world;
    };
    type.prototype.getInteract = function() {
        return this.interact;
    };
    return type;
})();