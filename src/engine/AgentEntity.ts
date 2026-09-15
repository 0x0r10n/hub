import { Container, Graphics, Text } from "pixi.js";
import type { Agent } from "@/types";
import { AnimationController, CHAR_BASE_SCALE, type AnimName, type FacingDir } from "./AnimationController";
import type { CharTextureSet } from "./SpriteManager";
import { CHAR_CELL_H, hexToNum } from "./textures";

const STATE_COLOR: Record<Agent["state"], number> = {
  "in-session": 0xff5fd1,
  roaming: 0x34eaf2,
  idle: 0x6c7699,
  recovering: 0xffc857,
  observing: 0xb083ff,
};

const CHAR_HEIGHT = CHAR_CELL_H * CHAR_BASE_SCALE;

export class AgentEntity {
  readonly view = new Container();
  readonly anim: AnimationController;
  readonly agent: Agent;
  private nameplateGroup = new Container();
  private nameplateBg: Graphics;
  private nameplateText: Text;
  private statusDot: Graphics;
  private shadow: Graphics;
  private selected = false;
  private hovered = false;

  constructor(agent: Agent, accentHex: string, textureSet: CharTextureSet, onSelect: (id: string) => void) {
    this.agent = agent;
    this.anim = new AnimationController(textureSet);

    this.shadow = new Graphics().ellipse(0, -2, 9, 3.5).fill({ color: 0x000000, alpha: 0.45 });

    const plateY = -CHAR_HEIGHT - 15;
    this.nameplateText = new Text({
      text: agent.name.toUpperCase(),
      style: { fontFamily: "monospace", fontSize: 9, fill: 0xe8ecff, letterSpacing: 0.5 },
    });
    this.nameplateText.anchor.set(0.5, 0.5);
    const padX = 5;
    const plateW = this.nameplateText.width + padX * 2;
    const plateH = 12;
    this.nameplateBg = new Graphics()
      .rect(-plateW / 2, -plateH / 2, plateW, plateH)
      .fill({ color: 0x050609, alpha: 0.78 })
      .stroke({ color: hexToNum(accentHex), width: 1, alpha: 0.9 });
    this.nameplateText.position.set(0, 0);
    this.nameplateGroup.addChild(this.nameplateBg, this.nameplateText);
    this.nameplateGroup.position.set(0, plateY);

    this.statusDot = new Graphics();
    this.drawStatusDot(agent.state);
    this.statusDot.position.set(0, plateY + plateH / 2 + 6);

    this.view.addChild(this.shadow, this.anim.sprite, this.nameplateGroup, this.statusDot);
    this.view.sortableChildren = false;

    this.view.eventMode = "static";
    this.view.cursor = "pointer";
    this.view.on("pointertap", (e) => {
      e.stopPropagation();
      onSelect(agent.id);
    });
    this.view.on("pointerover", () => this.setHovered(true));
    this.view.on("pointerout", () => this.setHovered(false));
    this.refreshEmphasis();
  }

  private drawStatusDot(state: Agent["state"]) {
    this.statusDot.clear();
    this.statusDot.circle(0, 0, 2).fill({ color: STATE_COLOR[state] });
  }

  setState(state: Agent["state"]) {
    this.drawStatusDot(state);
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    const scale = CHAR_BASE_SCALE * (selected ? 1.2 : 1);
    this.anim.sprite.scale.x = scale * Math.sign(this.anim.sprite.scale.x || 1);
    this.anim.sprite.scale.y = scale;
    this.refreshEmphasis();
  }

  private setHovered(hovered: boolean) {
    this.hovered = hovered;
    this.refreshEmphasis();
  }

  private refreshEmphasis() {
    const emphasized = this.selected || this.hovered;
    this.nameplateGroup.alpha = emphasized ? 1 : 0.82;
    this.nameplateGroup.scale.set(emphasized ? 1.1 : 1);
  }

  setPosition(x: number, y: number) {
    this.view.position.set(x, y);
  }

  setAnimation(facing: FacingDir, anim: AnimName) {
    this.anim.update(facing, anim);
  }

  setVisible(visible: boolean, scale = 1) {
    this.view.visible = visible;
    this.view.scale.set(scale);
  }

  destroy() {
    this.view.destroy({ children: true });
  }
}
