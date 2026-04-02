import React, { useEffect, useRef, FC, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import bg_ground from './assets/bg_ground.png'
import confetti from 'canvas-confetti'
// import parrots_src from './assets/parrot_pngs/*.png'
import './App.css'
import { Link } from "react-router-dom"
import { LinkButton } from './components/link';
import  useConfetti  from "./useSmallConfetti";


class Sprite{
  x: number;
  y: number;
  remainCount: number;
  addValue: number;
  frames: HTMLImageElement[];
  frameIndex = 0;
  lastTime = 0;
  judgeman: JudgeMan;
  readonly goalCount = 500;
  readonly frameDuration: number = 100;
  readonly random_max_lim = 20;
  readonly random_min_lim = 0;

  constructor(name: string, x: number, y: number, judgeman:JudgeMan, frames:HTMLIMageElement[] ) {
    this.name = name;
    this.view_name = this.name;
    this.x = x;
    this.y = y;
    this.isFinished = false;
    this.isFinish_registered = false;
    this.judgeman = judgeman;
    this.judgeman.add(this.name, this);
    this.frames = frames;
    this.remainCount = this.goalCount;
    this.addValue = 0;
    console.log("this called in Sprite constructor");

  }

  randomInt = (min: number, max: number) => {
    return (Math.floor(Math.random() * (max - min +1)) + min);
  }
  
  increment = () => {
    this.x += this.addValue;
    // setNum(refNum.current);
  };

  move_forward = () => {
    const random_max = Math.min(this.remainCount, this.random_max_lim);
    const randomValue = this.randomInt(this.random_min_lim, random_max);
    // ゴール判定
    this.isFinished = this.remainCount <= 0;
    // ゴールに着いたら止まる
    //  if ((this.remainCount- randomValue) < 0) {
    if (this.isFinished) {
      //すでについている場合はスキップ
      if (this.isFinish_registered){
        return;
      }
      
      console.log("runner finish")
      // judgemanに申告
      this.judgeman.register_arrive(this.name);
      // setMoveCount(0);
      this.remainCount = 0;
      this.addValue = 0;
      this.isFinished_registered = true;
      this.increment();
    }
    else{
      // setMoveCount(moveCount - randomValue);
      this.remainCount = this.remainCount - randomValue;
      this.addValue = randomValue;
      this.increment();
    }
  };

  draw = (ctx: CanvasRenderingContext2D) => {
    // キャンバス描画
    const img = this.frames[this.frameIndex];
    ctx.drawImage(img, this.x, this.y);
  }
  
  update(past_time: number) {
    if (past_time - this.lastTime > this.frameDuration) {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.move_forward();
      this.lastTime = past_time;

    }
    
  }

  resetPosition = () => {
    // const {handleNormalConfetti} = useConfetti(0.5, 0.5);
    // handleNormalConfetti();
    
    this.x = 0;
    this.remainCount = this.goalCount;

    console.log(this.judgeman.get_first());
  }
}

// ジャッジまんがすること
// レースの順位を保持
// ゴールした人が登録する
// ゴールすると紙吹雪を舞わせる

class JudgeMan {
  runners: Record<string, Sprite> = {};
  arrived_order: Record<string, Sprite> = {};
  test_num:number = 1;


  add(key: string, value: Sprite) {
    this.runners[key] = value;

    console.log("test")
  }

  // runnersから値をもってくると参照がどうなるか気になる。
  register_arrive(input_name:string){
    // 登録者じゃない場合リターン
    if(!Object.keys(this.runners).includes(input_name)){
      return;
    }
    let arrived_runner:Sprite = this.runners[input_name];
    // 既に到着者に登録済みの場合リターン
    if(Object.values(this.arrived_order).includes(arrived_runner)){
      return;
    }
    console.log("call judgeman!")

    
    let current_latest_order:number = Object.keys(this.arrived_order).length + 1;

    let order_key:string = current_latest_order.toString() + "th";
    console.log("order is:"+order_key)
    // let order_key:strig = "first"

    this.arrived_order[order_key] = this.runners[input_name];
    
    // 紙吹雪
    const {handleNormalConfetti} = useConfetti(0.5, 0.5);
    handleNormalConfetti();


  }

  get_first() {
    if (Object.keys(this.arrived_order).length == 0){
      return "wait still not finish!";
    }

    let first_key:string = "1th";
    const first_goal:Sprite = this.arrived_order[first_key];

    console.log(first_goal.name);
    return first_goal.name;
  }

  get(key: string): v | undefined {
    return this.runners[key];
  }

};

class GameManager{

};

export const App = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spriteRef = useRef<Sprite | null>(null);
  const parrot2 = useRef<Sprite | null>(null);
  const judgeman = useRef<JudgeMan | null>(null);

  const [debug_string, setDebug_string] = useState("");
  const [debug_remain, setDebug_remain] = useState(100);

  // 初期化
  useEffect(() => {
      const parrot_images = import.meta.glob('./assets/parrot_pngs/*.png', {
        eager: true,
        import: "default"
    });

    const input_imgs: HTMLImageElement[] = [];

    const framePaths = Object.values(parrot_images);

    framePaths.forEach((path) => {
      const img = new Image();
      img.src = path as string;
      input_imgs.push(img);
    });


    judgeman.current = new JudgeMan();
    if(!judgeman.current){
      console.log("no judgeman here");
    }
    else {
      console.log("judgeman's " + judgeman.current.test_num);
    }

    console.log("before create Spcrite");
    spriteRef.current = new Sprite("parrot1", 0, 0, judgeman.current, input_imgs);
    parrot2.current = new Sprite("parrot2", 0, 100, judgeman.current,  input_imgs);

    console.log("after create Sprite");

  }, []);

    // 初期位置に移動するイベント
  const resetPosition = () => {
    spriteRef.current.resetPosition();
    parrot2.current.resetPosition();
  };

  const frameIndexRef = useRef(0);

  const {handleNormalConfetti} = useConfetti(0.5, 0.5);

  // 画像のレンダリング
  useEffect(() => {
    let lastTime = 0;
    const frameDuration = 100; //ms

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg_img = new Image();
    bg_img.src = bg_ground;

    const render = (time: number) => {

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg_img, 0, 100);

      spriteRef.current.update(time);
      spriteRef.current.draw(ctx);

      parrot2.current.update(time);
      parrot2.current.draw(ctx);

      // 10fに一度state更新
      if ( judgeman.current && Math.floor(time) % 10 === 0){
        setDebug_string(judgeman.current.get_first())

      }
      setDebug_remain(parrot2.current?.remainCount)
      
      requestAnimationFrame(render);

    };


    render();

  }, []);

  return (
    <>
    <canvas ref={ canvasRef } width = {1000} height = {600}></canvas>

    <button onClick={ resetPosition }>リセット</button>
    <button onClick= { handleNormalConfetti }>紙吹雪</button>
    <label>{ debug_string } </label> 
    <label>reamin:{ debug_remain }</label>
    
    
    </>
    

  );
};

export default App
