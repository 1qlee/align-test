import "./App.css";
import { useRef, useState } from "react";
import { gridData } from "./data/grid";
import { gsap } from "gsap";
import CustomBounce from "gsap/CustomBounce";
import CustomEase from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import clsx from "clsx";
import { easingOptions } from "./data/easing";

gsap.registerPlugin(useGSAP, Draggable, CustomEase, CustomBounce, Flip);

function App() {
  const [gridItems, setGridItems] = useState(gridData);
  const [flipDuration, setFlipDuration] = useState(0.2);
  const [flipEase, setFlipEase] = useState("none");
  const [flipEaseDirection, setFlipEaseDirection] = useState("out");
  const flipState = useRef<Flip.FlipState | null>(null);
  const draggedTile = useRef<HTMLElement | null>(null);
  const prevHitTile = useRef<HTMLElement | null>(null);
  const tileRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const filteredRefs = tileRefs.current.filter(
        (ref) => ref?.dataset.locked === "false"
      );

      Draggable.create(filteredRefs, {
        bounds: gridContainerRef.current,
        edgeResistance: 0.5,
        onPress: function () {
          draggedTile.current = this.target;

          gsap.to(this.target, {
            scale: 1.1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            duration: 0.2,
          });

          gsap.to(this.target.parentElement, {
            borderColor: "orange",
            duration: 0.2,
          });
        },
        onRelease: function () {
          gsap.to(this.target, {
            scale: 1,
            boxShadow: "none",
            delay: flipDuration,
            duration: 0.2,
          });
          gsap.to(this.target.parentElement, {
            borderColor: "transparent",
            delay: flipDuration,
            duration: 0.2,
          });
        },
        onDrag: function () {
          var i = tileRefs.current.length;
          let highestCoverage = 0;
          let hitTileWithHighestCoverage = null;

          while (--i > -1) {
            if (this.hitTest(tileRefs.current[i], "0%")) {
              const hitTile = tileRefs.current[i];

              if (hitTile?.dataset.locked === "true") {
                continue; // Skip locked tiles
              }

              // Check for the percentage of overlap, from 100% down to 1%
              for (let p = 100; p >= 1; p--) {
                if (this.hitTest(hitTile, `${p}%`)) {
                  if (p > highestCoverage) {
                    highestCoverage = p;
                    hitTileWithHighestCoverage = hitTile;
                  }
                  // Once we've found the highest overlap for this tile, we can break the inner loop
                  break;
                }
              }
            }
          }

          if (hitTileWithHighestCoverage !== prevHitTile.current) {
            // Scale down the PREVIOUS winner if it exists
            if (prevHitTile.current) {
              gsap.to(prevHitTile.current.parentElement, {
                borderColor: "transparent",
                duration: 0.2,
                overwrite: "auto",
              });

              gsap.to(prevHitTile.current, {
                scale: 1,
                duration: 0.2,
                overwrite: "auto",
              });
            }

            if (hitTileWithHighestCoverage) {
              gsap.to(hitTileWithHighestCoverage.parentElement, {
                borderColor: "orange",
                duration: 0.2,
                overwrite: "auto",
              });
              gsap.to(hitTileWithHighestCoverage, {
                scale: 0.9,
                duration: 0.2,
                overwrite: "auto",
              });
            }

            flipState.current = Flip.getState(tileRefs.current);
            prevHitTile.current = hitTileWithHighestCoverage;
          }
        },
        onDragEnd: function () {
          if (prevHitTile.current) {
            const newGridItems = structuredClone(gridItems);
            const draggedIndex = parseInt(this.target.dataset.index!, 10);
            const overlappedIndex = parseInt(
              prevHitTile.current.dataset.index!,
              10
            );

            // Swap the positions of the dragged tile and the overlapped tile
            const tempDraggedIndex = newGridItems.findIndex(
              (item) => item.index === draggedIndex
            );
            const tempOverlappedIndex = newGridItems.findIndex(
              (item) => item.index === overlappedIndex
            );
            const temp = newGridItems[tempDraggedIndex];
            newGridItems[tempDraggedIndex] = newGridItems[tempOverlappedIndex];
            newGridItems[tempOverlappedIndex] = temp;

            setGridItems(newGridItems);

            // reset position for flip
            gsap.set(draggedTile.current, {
              x: 0,
              y: 0,
            });

            gsap.to(prevHitTile.current.parentElement, {
              borderColor: "transparent",
              delay: flipDuration,
              duration: 0.2,
            });

            gsap.to(draggedTile.current, {
              scale: 1,
              boxShadow: "none",
              duration: 0.2,
            });
          } else {
            gsap.to(draggedTile.current, {
              x: 0,
              y: 0,
              duration: 0.2,
            });
          }

          prevHitTile.current = null;
        },
      });
    },
    { dependencies: [gridItems] }
  );

  useGSAP(
    () => {
      if (flipState.current) {
        console.log("useGSAP Flip effect");
        // Apply the flip state to animate the grid items
        Flip.from(flipState.current, {
          duration: flipDuration,
          scale: true,
          ease: `${flipEase}.${flipEaseDirection}`,
        });

        gsap.to(tileRefs.current, {
          scale: 1,
          delay: flipDuration,
          duration: 0.2,
        });
      }
    },
    { dependencies: [gridItems] }
  );

  return (
    <div className="bg-white shadow-lg rounded-xl p-2 md:p-8 w-max h-max">
      <a target="_blank" href="https://gsap.com/docs/v3/Eases">
        Learn more about easing
      </a>
      <fieldset className="flex justify-center items-center gap-2 w-full">
        <label className="block text-black">Ease function:</label>
        <select
          value={flipEase}
          onChange={(e) => setFlipEase(e.target.value)}
          className="block border border-gray-300 rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       bg-white text-gray-900 text-base"
        >
          {easingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset className="flex justify-center items-center gap-2 w-full">
        <label className="block text-black">Ease direction:</label>
        <select
          value={flipEaseDirection}
          onChange={(e) => setFlipEaseDirection(e.target.value)}
          className="block border border-gray-300 rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       bg-white text-gray-900 text-base"
        >
          <option value="out">out</option>
          <option value="in">in</option>
          <option value="inOut">inOut</option>
        </select>
      </fieldset>
      <fieldset className="flex justify-center items-center gap-2 w-full">
        <label className="block text-black">Swap duration:</label>
        <div className="flex gap-1">
          <input
            value={flipDuration}
            onChange={(e) => setFlipDuration(+e.target.value)}
            type="range"
            max={1}
            step={0.05}
            min={0.1}
          />
          <span className="text-black">{flipDuration * 1000} ms</span>
        </div>
      </fieldset>
      <div
        ref={gridContainerRef}
        className="grid grid-cols-5 gap-2 bg-orange-100 p-2 border border-orange-900 rounded-lg"
      >
        {gridItems.map((item, index) => (
          <div
            key={`cell-${item.index}`}
            className="grid border-dashed place-items-center relative border-2 border-transparent border-orange-900 aspect-square rounded-full h-[96px] w-[96px]"
          >
            <span
              ref={(el) => {
                tileRefs.current[index] = el;
              }}
              data-locked={item.locked}
              data-index={item.index}
              className={clsx(
                item.locked
                  ? "bg-orange-100 text-orange-900 z-0"
                  : "text-orange-100 bg-orange-700 border-1 border-b-4 border-orange-900 z-2",
                `relative flex items-center justify-center
                font-bold text-[48px]
                aspect-square rounded-full
                transition-colors duration-200
                select-none
                h-full w-full`
              )}
            >
              {item.string}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
