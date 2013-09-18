var assert = require('timoxley-assert')
  , core = require('json-schema-core')
  , Document = core.Document
  , Schema = core.Schema


fixtures = {};

Schema.addBinding('nodeTypeAt', nodeTypeAt);


// stupid binding function for testing
function nodeTypeAt(path){
  var target = this.schema.$(path)
  return target && target.nodeType;
}

///////////////////////////////////

describe('json-schema-core', function(){
  describe('parse simple', function(){
    
    beforeEach( function(){
      this.subject = new Schema().parse(fixtures.parse.simple);
    })

    it('should parse', function(){ 
      console.log("subject simple: %o", this.subject);
    })

    it('should have properties condition', function(){
      var conditions = this.subject;
      assert(conditions.get('properties'));
      assert(conditions.get('properties').nodeType == 'Properties');
    })

    it('should have type condition', function(){
      var conditions = this.subject;
      assert(conditions.get('type'));
      assert(conditions.get('type').nodeType == 'Type');
    })

    it('should have unparsed properties', function(){
      assert(this.subject.property('foo'));
      assert(this.subject.property('bar'));
    })
    
    it('should store path', function(){
      var conditions = this.subject
      assert('#' == this.subject.path);
    })

    it('should store path for each node', function(){
      var conditions = this.subject
      assert('#/properties' == conditions.get('properties').path);
      assert('#/type' == conditions.get('type').path);
    })

  })

  describe('parse properties', function(){

    beforeEach( function(){
      this.subject = new Schema().parse(fixtures.parse.properties);
    })

    it('should parse', function(){ 
      console.log("subject properties: %o", this.subject);
    })

    it('should parse each property value as a schema', function(){
      var props = this.subject.get('properties');
      props.each(function(key,val){
        assert(val.nodeType == 'Schema'); 
      })
      assert(props.get('one'));
      assert(props.get('two'));
      assert(props.get('three'));
    })

    it('should store path for each node', function(){
      var props = this.subject.get('properties');
      assert('#/properties' == props.path);
      assert('#/properties/one' == props.get('one').path);
      assert('#/properties/two' == props.get('two').path);
      assert('#/properties/three' == props.get('three').path);
      assert('#/properties/one/type' == props.get('one').get('type').path);
      assert('#/properties/two/type' == props.get('two').get('type').path);
      assert('#/properties/three/type' == props.get('three').get('type').path);
    })

  })

  describe('parse type', function(){

    beforeEach( function(){
      this.subject = new Schema().parse(fixtures.parse.type);
    })

    it('should parse', function(){ 
      console.log("subject type: %o", this.subject);
    })

    it('should parse simple type', function(){
      var props = this.subject.get('properties')
        , prop = props.get('simple')
        , type = prop.get('type')
      assert(type.get() == 'string');
      assert(!type.isArray);
    })

    it('should parse multi value type', function(){
      var props = this.subject.get('properties')
        , prop = props.get('multi')
        , type = prop.get('type')
      assert(type.isArray);
      assert(type.has(0));
      assert(type.has('1'));
      assert(type.has('2'));
    })

    it('should store path for each node', function(){
      var props = this.subject.get('properties')
      props.each( function(key,prop){
        assert('#/properties/'+key == prop.path);
        var type = prop.get('type');
        assert('#/properties/'+key+'/type' == type.path);
      })
    })

  })

  describe('parse allOf', function(){

    beforeEach( function(){
      this.subject = new Schema().parse(fixtures.parse.allof);
    })

    it('should parse', function(){ 
      console.log("subject allof: %o", this.subject);
    })

    it('should parse each array item as a schema', function(){
      var allof = this.subject.get('allOf');
      allof.each(function(i,val){
        assert(val.nodeType == 'Schema'); 
      })
      assert(allof.get('0'));
      assert(allof.get(1));
      assert(allof.get('2'));
    })

    it('should store path for each node', function(){
      var allof = this.subject.get('allOf');
      assert('#/allOf' == allof.path);
      assert('#/allOf/0' == allof.get(0).path);
      assert('#/allOf/1' == allof.get('1').path);
      assert('#/allOf/2' == allof.get(2).path);
      assert('#/allOf/1/properties' == allof.get('1').get('properties').path);
      assert('#/allOf/2/properties/simple/type' == 
             allof.get(2).get('properties').get('simple').get('type').path
            );
    })

  })



  // todo: more node types
  describe('parse other node types', function(){
    it('should have some tests, once I start implementing validation');
  })


  describe('search paths', function(){
    
    beforeEach(function(){
      this.document = new Document().parse(fixtures.search.all);
      this.subject = this.document.root();
    })

    it('should find root from document', function(){
      assert(this.document.$('#') === this.subject);
    })

    it('should find root from root', function(){
      assert(this.subject.$('#') === this.subject);
    })

    it('should find root from branch', function(){
      var branch = this.subject.get('definitions').get('one').get('type');
      assert(branch);
      assert(branch.$('#') === this.subject);
    })

    it('should find branch from document', function(){
      var branch = this.subject.get('properties').get('one').get('oneOf').get(1);
      assert(branch);
      assert(this.document.$('#/properties/one/oneOf/1') === branch);
    })

    it('should find branch from root', function(){
      var branch = this.subject.get('properties').get('one').get('oneOf').get(1);
      assert(branch);
      assert(this.subject.$('#/properties/one/oneOf/1') === branch);
    })

    it('should find branch from another branch', function(){
      var branch1 = this.subject.get('definitions').get('two');
      var branch2 = this.subject.get('properties').get('one').get('oneOf').get('1');
      assert(branch1);
      assert(branch2);
      assert(branch1.$('#/properties/one/oneOf/1') === branch2);
      assert(branch2.$('#/definitions/two') === branch1);
    })

    it('should find relative branch from root', function(){
      var branch = this.subject.get('properties').get('one').get('oneOf').get(1);
      assert(branch);
      assert(this.subject.$('properties/one/oneOf/1') === branch);
    })

    it('should find relative branch from another branch', function(){
      var branch1 = this.subject.get('properties').get('one');
      var branch2 = this.subject.get('properties').get('one').get('oneOf').get(1);
      assert(branch1);
      assert(branch2);
      assert(branch1.$('oneOf/1') === branch2);
    })

  })

  describe('dereference paths', function(){

    beforeEach(function(){
      this.document = new Document().parse(fixtures.deref.paths);
      this.subject = this.document.root();
    })

    it('should parse', function(){ 
      console.log("document: %o", this.document);
    })

    it('should dereference back-references', function(){
      var props = this.subject.get('properties')
        , schema = props.get('back')
      assert(schema);
      assert(schema.nodeType == 'Schema');
      assert('string' == schema.get('type').get());
    })

    it('should store forward-references', function(){
      var refs = this.document.referrers;
      assert('#/definitions/string' === refs['#/definitions/forward']);
    })

    it('should dereference forward-references', function(){
      assert(this.document.getPath('#/definitions/string') === 
             this.document.getPath('#/definitions/forward')
            );
    })

  })

  describe('binding', function(){
   
    function bindTo(sch,inst){
      var schema = new Schema().parse(fixtures.correlate[sch]);
      return schema.bind(fixtures.instance[inst]);
    }

    it('should bind to an instance', function(){
      var act = bindTo('simple', 'valid');
      assert(act);
    })
   
    it('should get sub-correlate', function(){
      var subject = bindTo('simple','valid');
      var expschema = subject.schema.get('properties').get('complex')
        , expinst = subject.instance.complex
      var act = subject.get('complex');
      assert(act);
      assert(expschema === act.schema);
      assert(expinst   === act.instance);
    })

    it('should get sub-correlate recursively', function(){
      var subject = bindTo('simple','valid');
      var expschema = subject.schema.get('properties').get('complex')
                                    .get('properties').get('two')
        , expinst = subject.instance.complex.two
      assert(expschema);
      assert(expinst);
      var act = subject.$('#/complex/two');
      assert(act);
      assert(expschema === act.schema);
      assert(expinst   === act.instance);
    })

    it('should return undefined if instance doesnt have specified property in schema', function(){
      var subject = bindTo('simple','invalid');
      var expschema = subject.schema.get('properties').get('complex')
                                    .get('properties').get('two')
        , expinst = subject.instance.complex.two
      assert(expschema);
      assert(expinst === undefined);
      var act = subject.$('#/complex/two');
      assert(act === undefined);
    })

    it('should return undefined if schema doesnt have specified property in instance', function(){
      var subject = bindTo('simple','additional');
      var expschema = subject.schema.get('properties').get('complex')
                                    .get('properties').get('four')
        , expinst = subject.instance.complex.four
      assert(expschema === undefined);
      assert(expinst);
      var act = subject.$('#/complex/four');
      assert(act === undefined);
    })
    
    it('should mix in binding method', function(){
      var subject = bindTo('simple','valid');
      assert(subject.nodeTypeAt);
    })
    
    it('binding method should be callable bound to correlation', function(){
      var subject = bindTo('simple','valid');
      assert('Schema' == subject.nodeTypeAt('#/properties/complex/properties/three'));
    })

  })

  describe('Schema#and', function(){

    beforeEach( function(){
      this.s1 = new Schema().parse(fixtures.parse.simple);
      this.s2 = new Schema().parse(fixtures.parse.properties);
      this.s3 = new Schema().parse(fixtures.parse.type);
      this.subject = new Schema()
    })

    it('should return new schema with the current schema plus all passed schemas within allOf', function(){
      var act = this.subject.and(this.s1,this.s2,this.s3); 
      console.log('schema AND: %o', act);
      var allOf = act.get('allOf');
      assert(allOf);
      var n=0; allOf.each(function(){ n++; });
      assert(4 == n);
    })

  })

})



// fixtures

fixtures.parse = {};
fixtures.parse.simple = {
  type: 'object',
  properties: { },
  foo: { },
  bar: { }
}

fixtures.parse.properties = {
  properties: {
    one: {type: 'string'},
    two: {type: 'numeric'},
    three: {type: 'enum'}
  }
}

fixtures.parse.type = {
  properties: {
    simple: { type: 'string' },
    multi:  { type: ['string', 'numeric', 'enum'] }
  }
}

fixtures.parse.allof = {
  allOf: [
    fixtures.parse.simple,
    fixtures.parse.properties,
    fixtures.parse.type
  ]
}

fixtures.search = {};
fixtures.search.all = {
  definitions: {
    one: { type: ['string','boolean'] },
    two: { }
  },
  properties: {
    one: { oneOf: [ { type: 'string' }, { type: 'boolean' } ] }
  }
}

fixtures.deref = {};
fixtures.deref.paths = {
  definitions: {
    forward: { '$ref': '#/definitions/string'},
    string: { type: 'string' }
  },
  properties: {
    back: {'$ref': '#/definitions/string'},
    self: {'$ref': '#'}
  }
}

  
fixtures.correlate = {};
fixtures.correlate.simple = {
  properties: {
    simple: { type: 'string' },
    complex: { 
      type: 'object',
      properties: {
        one: {},
        two: {
          type: 'object',
          properties: {
            deep: {}
          }
        },
        three: {}
      }
    }
  }
}

fixtures.instance = {};
fixtures.instance.valid = {
  simple: "word",
  complex: {
    one: "of",
    two: {
      deep: "sea"
    },
    three: "kings"
  }
}

fixtures.instance.invalid = {
  simple: "man",
  complex: {
    one: "to",
    three: "years"
  }
}

fixtures.instance.additional = {
  simple: "giant",
  complex: {
    one: "hand",
    two: {
      deep: "trees"
    },
    three: "fellows",
    four: "sleep"
  }
}



