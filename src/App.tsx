import * as React from "react";
import { observable, action, computed } from "mobx";
import { observer } from "mobx-react";

type Nullable<T> = T | void;

type Direction = "UP" | "DOWN";

type Order = [number, Nullable<Direction>];

const wait = async (t: number) => {
  await new Promise(r => setTimeout(r, t));
};

class Elevator {
  constructor(public min: number, public max: number) {}

  private action: boolean = false;
  private destination: number | void = undefined;

  @observable
  storey = 0;
  @observable
  doorOpen = false;
  @observable
  queue: Order[] = [];
  @observable
  direction: Nullable<Direction> = undefined;

  @computed
  get storeys() {
    return this.max - this.min;
  }

  @action
  async move() {
    this.action = true;
    await wait(1000);
    if (this.direction === "UP" && this.storey !== this.max) {
      this.storey++;
    } else if (this.direction === "DOWN" && this.storey !== this.min + 1) {
      this.storey--;
    }
    this.action = false;
  }
  @action
  async openDoor() {
    this.action = true;
    this.doorOpen = true;
    await wait(300);
    this.doorOpen = false;
    this.action = false;
  }
  @action
  private async evaluate() {
    if (this.action) {
      return;
    }
    if (this.destination === undefined) {
      const next = this.queue.shift();
      if (!next) return;
      this.destination = next[0];
      this.evaluate();
    } else if (this.destination === this.storey) {
      this.direction = undefined;
      this.destination = undefined;
      await this.openDoor();
      this.evaluate();
    } else {
      const fromQueue = this.checkQueueForDuplicates([this.storey, "UP"]);
      if (fromQueue) {
        // @ts-ignore We can ignore those errors because we check if fromQueue exists
        if (fromQueue[1] === this.direction || !fromQueue[1]) {
          await this.openDoor();
          this.queue = this.queue.filter(el => el[0] !== this.storey);
        }
      }
      this.direction = this.destination > this.storey ? "UP" : "DOWN";
      await this.move();

      this.evaluate();
    }
  }
  @action
  order(order: Order) {
    // prevent rage clicking. However, it might be interesting to take rage into consideration
    if (this.checkQueueForDuplicates(order) || this.destination === order[0]) {
      return;
    }
    this.queue.push(order);
    this.evaluate();
  }

  checkQueueForDuplicates(order: Order) {
    return (
      this.queue.find(el => el[0] === order[0]) || order[0] === this.destination
    );
  }
}

@observer
class App extends React.Component {
  elevator = new Elevator(-4, 10);
  render() {
    return (
      <div>
        <h1 style={{ textAlign: "center" }}>ELEVATOR</h1>
        <div style={{ display: "flex", padding: "15px" }}>
          <div style={{ width: "100%" }}>
            <h2 style={{ textAlign: "center" }}>The building</h2>
            <div style={{ padding: "15px", textAlign: "center" }}>
              {
                { UP: "/\\", DOWN: "\\/", " ": "===" }[
                  this.elevator.direction || " "
                ]
              }
            </div>
            <div>
              {Array(this.elevator.storeys)
                .fill(undefined)
                .map((el: void, i: number) => {
                  const storey = this.elevator.max - i;
                  return (
                    <div
                      style={{
                        padding: "15px",
                        border: "1px solid black",
                        background:
                          storey === this.elevator.storey
                            ? this.elevator.doorOpen
                              ? "green"
                              : "red"
                            : "white"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-around"
                        }}
                      >
                        <span>{storey}</span>
                        <button
                          onClick={() => this.elevator.order([storey, "UP"])}
                        >
                          Order up
                        </button>
                        <button
                          onClick={() => this.elevator.order([storey, "DOWN"])}
                        >
                          Order down
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <h2 style={{ textAlign: "center" }}>
              Storey pad inside the elevator
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                padding: "15px"
              }}
            >
              {Array(this.elevator.storeys)
                .fill(undefined)
                .map((el: void, i: number) => (
                  <div
                    onClick={() =>
                      this.elevator.order([this.elevator.max - i, undefined])
                    }
                    style={{
                      cursor: "pointer",
                      margin: "5px",
                      width: "50px",
                      height: "50px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "2px solid orange",
                      borderRadius: "100px",
                      background: this.elevator.checkQueueForDuplicates([
                        this.elevator.max - i,
                        undefined
                      ])
                        ? "orange"
                        : "white"
                    }}
                  >
                    {this.elevator.max - i}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
