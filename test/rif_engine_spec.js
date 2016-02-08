define('rif/engine', function() {
describe('rif_engine', function() {
   "use strict";
    var engine;
    function loadFile(name, completion) {
        completion('');
    }
    beforeEach(function() {
        var completed = false;
        runs(function() {
            var params = {
                rif_file: 'somefile',
                load_file: loadFile,
                dom: jasmine.createSpyObj('dom', ['append', 'createDiv'])
            };
            engine = new RifEngine(params, function() {
                completed = true;
            });
        });
        waitsFor(function() {
            return completed;
        }, "Initialize engine", 3000);
    });
    it('should create a world', function() {
        expect(engine.getWorld()).not.toBeNull();
    });
    it('should create an interact', function() {
        expect(engine.getInteract()).not.toBeNull();
    });
});

});
