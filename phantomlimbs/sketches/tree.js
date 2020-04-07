let tree;
let branches = [];
let iniAngBr = 0; //initial angle of branch, should be 0 at first
let iniNumSub = 6; //number of sub-branches, should be less than 8
let iniLife = 24; //how big, 20~25 is ideal
let iniMaxLen = 30; //max length of twig
let iniMaxWei = 20; //max weight of twig
let tid = 0;
let noiseVal = 0;

function setup() {
  //let canvas = createCanvas(800, 600);
  canvas.parent('sketch1_container');
  createNewTree();
}

function draw() {
  background(0);
  noiseVal = noise(mouseX, mouseY) * 0.5;
  drawTree();
}

function drawTree() {
  for (let i = 0; i < branches.length; i++) {
    let br = branches[i];
    br.update();
    br.display();
  }

  branchForkPoints = [];
}

function createNewTree() {
  branches.length = 0;
  let id = 0;
  tid = 0;
  let br = new Branch(width / 2, height, iniLife,
    iniAngBr, iniNumSub, iniMaxLen, iniMaxWei, id);
  branches.push(br);
  for (let i = 0; i < branches.length; i++) {
    let br = branches[i];
    for (let j = 0; j < 1000; j++) {
      br.grow();
      if (br.isAtSubPoint()) {
        let x = br.x;
        let y = br.y;
        let pbi = i;
        let pti = j + 1;
        //Decide angle of new branch 30~45 degree + or -:
        let ang = br.angBr + random(30, 45) * (int(random(2)) * 2 - 1);
        let num = br.numSub - 1;
        let life = br.life - 4;
        let mlen = br.len;
        let mwei = br.wei;
        if (num > 1 && life > 0) {
          id = id + 1;
          branches.push(new Branch(x, y, life, ang, num, mlen, mwei, id, pbi, pti));
        }
      }
    }
  }
}

class Branch {
  constructor(_x, _y, _l, _a, _n, _ml, _mw, _id, _pbi, _pti) {
    this.x = _x;
    this.y = _y;
    this.life = _l;
    this.angBr = _a;
    this.numSub = _n;
    this.maxlen = _ml;
    this.maxwei = _mw;
    this.count = 0;
    this.twigs = [];
    this.ang = 0;
    this.len = 0;
    this.wei = 0;
    this.id = _id;
    this.prevBranchInd = _pbi;
    this.prevTwigInd = _pti;
    this.g = iniNumSub - this.numSub;
    this.color = color(255 - (this.g * this.maxlen / this.maxwei + 100));
  }


  grow() {
    //Create twigs until count is smaller than life
    if (this.count < this.life) {
      this.ang = random(this.angBr - 12, this.angBr + 12);
      //Length of twig : min 2 while count increases:
      this.len = map(this.count, 1, this.life, this.maxlen, 2);
      //Weight of twig : min 1 while count increases:
      if (this.count > this.life - 9) {
        this.wei = map(this.count, 1, this.life, this.maxwei / 1.5, 1);
      } else {
        this.wei = map(this.count, 1, this.life, this.maxwei, 1);
      }
      let t = new Twig(this.x, this.y, this.ang,
        this.len, this.wei, this.color, tid);
      this.twigs.push(t);
      //Remember end point x2, y2 to apply to next twig:
      this.x = t.x2;
      this.y = t.y2;

      this.count++;
      tid++;
    }
  }

  update() {
    for (let i = 0; i < this.twigs.length; i++) {
      let t = this.twigs[i];
      let pt = {};
      let px = t.x;
      let py = t.y;
      
      // This updates the twig at the fork between branches:
      if (i == 0 && this.g > 0) {
        pt = branches[this.prevBranchInd].twigs[this.prevTwigInd];
        px = pt.x;
        py = pt.y;
      }

      // This updates the twigs positions with respect
      // to their own branch:
      if (i >= 1) {
        pt = this.twigs[i - 1];
        px = pt.x2;
        py = pt.y2;
      }

      t.update(px, py, noiseVal/2);
    }
  }

  display() {
    for (let i = 0; i < this.twigs.length; i++) {
      let t = this.twigs[i];
      let px = t.x;
      let py = t.y;

      t.display();
    }
  }

  isAtSubPoint() {
    if (this.count % round(this.life / this.numSub) == 0 && this.count != this.life) {
      return true;
    } else {
      return false;
    }
  }
}

class Twig {
  constructor(_x, _y, _a, _l, _w, _c, _id) {
    this.x = _x;
    this.y = _y;
    this.ang = _a;
    this.len = _l;
    this.wei = _w;
    this.color = _c;
    this.x2 = this.x + this.len * sin(radians(this.ang));
    this.y2 = this.y - this.len * cos(radians(this.ang));
    this.id = _id;
  }

  update(_px, _py, _f) {
    this.ang = this.ang + random(-_f, _f);
    this.x = _px;
    this.y = _py;
    this.x2 = this.x + sin(radians(this.ang)) * this.len;
    this.y2 = this.y - cos(radians(this.ang)) * this.len;
  }

  display() {
    stroke(this.color);
    strokeWeight(this.wei);
    line(this.x, this.y, this.x2, this.y2);
  }
}