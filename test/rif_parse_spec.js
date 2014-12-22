describe("rifParse", function () {
    it("should return an empty result for an empty input", function () {
        expect(rifParse([])).toEqual({});
    });
    it("should parse an empty object", function () {
        var rif = rifParse( [ {token: "object", value: "anObject"} ] );
        expect(rif.objects).toEqual( { anObject: {} } );
    });
    it("should parse an empty responses list", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: {} } );
    });
});
