describe("rifParse", function () {
    it("should return an empty result for an empty input", function () {
        expect(rifParse([])).toEqual({});
    });
    it("should parse a single object", function () {
        var rif = rifParse( [ {token: "object", value: "anObject"} ] );
        expect(rif.objects).toEqual( { anObject: {} } );
    });
    it("should parse an empty responses set", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: [] } );
    });
    it("should parse multiple objects", function () {
        var rif = rifParse(
            [
                {token: "object", value: "anObject"},
                {token: "object", value: "anotherObject"}
            ] );
        expect(rif.objects).toEqual(
            {
                anObject: {},
                anotherObject: {}
            } );
    });
    it("should parse multiple responses sets", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "end", value: ""},
                {token: "responses", value: "anotherObject"},
                {token: "end", value: ""}
            ] );
        expect(rif.responses).toEqual(
            {
                anObject: [],
                anotherObject: []
            } );
    });
    it("should parse a responses set with one response", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "response", value: ""},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: [{}] } );
    });
    it("should parse a responses set with two responses", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "response", value: ""},
                {token: "response", value: ""},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: [{}, {}] } );
    });
    it("should parse response text", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "text", value: "some text to display for this response"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{text: "some text to display for this response"}] } );
    });
    it("should parse response maxusecount", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "maxusecount", value: "42"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{maxusecount: 42}] } );
    });
    it("should parse response topics", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "topics", value: "topicA topicB topicC"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{topics: ["topicA", "topicB", "topicC"]}] } );
    });
    it("should parse response subtopics", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "subtopics", value: "subtopicA subtopicB subtopicC"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{subtopics: ["subtopicA", "subtopicB", "subtopicC"]}] } );
    });
    it("should parse response needs", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "needs", value: "need1 need2"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{needs: ["need1", "need2"]}] } );
    });
    it("should parse response sets", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "sets", value: "value1 value2 value3"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{sets: ["value1", "value2", "value3"]}] } );
    });
    it("should parse response calls", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "calls", value: "call1 call2 call3"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{calls: ["call1", "call2", "call3"]}] } );
    });
    it("should parse response suggests", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "suggests", value: "topic1 topic2 topic3"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{suggests: ["topic1", "topic2", "topic3"]}] } );
    });
    it("should parse response prompt", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "prompt", value: "A response prompt"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{prompt: "A response prompt"}] } );
    });
    it("should parse response display class", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "response", value: ""},
                {token: "display_class", value: "someclass"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { anObject: [{display_class: "someclass"}] } );
    });
});
