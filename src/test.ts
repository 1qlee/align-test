import "./App.css";
import { useRef, useState, useEffect } from "react";
import { gridData } from "./data/grid";
import { gsap } from "gsap";
import CustomBounce from "gsap/CustomBounce";
import CustomEase from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import clsx from "clsx";

gsap.registerPlugin(useGSAP, Draggable, CustomEase, CustomBounce, Flip);

function App() {
  const [gridItems, setGridItems] = useState(gridData);
  const flipState = useRef<Flip.FlipState | null>(null);
  const tileRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const previousHighestCoverageTile = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      tileRefs.current.forEach((item) => {
        if (item && item.dataset.locked === "false") {
          const draggedBox = item.getBoundingClientRect();

          Draggable.create(item, {
            type: "x,y",
            bounds: gridContainerRef.current,
            inertia: false,
            edgeResistance: 0.5,
            onPress: function () {
              // Reset Y position immediately before new drag starts, just in case
              gsap.set(item, { x: 0, y: 0 });
              const bounds = item.getBoundingClientRect();
              // Calculate the current offset of the cursor from the top-left corner of the element's bounding box.
              const cursorOffsetY = this.pointerY - bounds.top;

              // Offset the item to be 70% of its height above the cursor position.
              const desiredOffsetY = bounds.height * 0.7;
              const newY = cursorOffsetY - desiredOffsetY;

              gsap.set(item, {
                y: newY,
              });

              this.update();

              gsap.to(item.parentElement, {
                duration: 0.2,
                borderColor: "gray",
                overwrite: true,
              });

              gsap.to(item, {
                duration: 0.1,
                ease: CustomBounce.create("myBounce", {
                  strength: 0.3,
                  endAtStart: false,
                  squash: 1,
                  squashID: "myBounce-squash",
                }),
                scale: 0.9,
                boxShadow: `0px 8px 25px rgba(0, 0, 0, 0.3), /* Darker, more pronounced main shadow */
                0px 15px 40px rgba(0, 0, 0, 0.15), /* Larger, softer ambient shadow */
                0px 5px 8px rgba(0, 0, 0, 0.08)`,
              });
            },
            onRelease: function () {
              const newGridItems = [...gridItems];

              // if (gridContainerRef.current) {
              //   const nonLockedChildren = Array.from(
              //     gridContainerRef.current.children
              //   ).filter((childDiv) => {
              //     // The actual span element is inside the div
              //     const spanEl = childDiv.querySelector("span");
              //     return spanEl && spanEl.dataset.locked === "false";
              //   });

              //   if (nonLockedChildren.length > 0) {
              //     flipState.current = Flip.getState(nonLockedChildren);
              //     console.log(
              //       "Flip state captured for non-locked tiles:",
              //       flipState.current
              //     );
              //   } else {
              //     flipState.current = null; // No elements to track for flip
              //     console.log("No non-locked tiles to capture state for.");
              //   }
              // }

              if (previousHighestCoverageTile.current) {
                const toDragBox =
                  previousHighestCoverageTile.current.getBoundingClientRect();
                // If the dragged tile is currently overlapping another tile, swap their positions
                const draggedIndex = parseInt(item.dataset.index!, 10);
                const overlappedIndex = parseInt(
                  previousHighestCoverageTile.current.dataset.index!,
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
                newGridItems[tempDraggedIndex] =
                  newGridItems[tempOverlappedIndex];
                newGridItems[tempOverlappedIndex] = temp;

                const test = toDragBox.left - draggedBox.left;
                const test2 = toDragBox.top - draggedBox.top;

                console.log(gsap.getProperty(item, "x"));

                gsap.to(item, {
                  duration: 0.2,
                  x: test,
                  y: test2,
                });

                gsap.to(item, {
                  duration: 0.2,
                  delay: 0.2,
                  scale: 1,
                  boxShadow: "none",
                });

                gsap.set(previousHighestCoverageTile.current.parentElement, {
                  borderColor: "transparent",
                });

                // gsap.to(previousHighestCoverageTile.current, {
                //   scale: 1,
                //   duration: 0.4,
                //   onComplete: () => {
                //     gsap.set(item, { clearProps: "x,y" });
                //     // Reset the previous highest coverage tile reference
                //     previousHighestCoverageTile.current = null;
                //     setGridItems(newGridItems);
                //   },
                // });
              } else {
                gsap.to(item.parentElement, {
                  delay: 0.15,
                  duration: 0.2,
                  borderColor: "transparent",
                });

                gsap.to(item, {
                  duration: 0.2,
                  x: 0,
                  y: 0,
                });

                gsap.to(item, {
                  duration: 0.2,
                  delay: 0.25,
                  scale: 1,
                  boxShadow: "none",
                });
              }
            },
            onDrag: function () {
              let highestCoverage = 0;
              let hitTileWithHighestCoverage = null;
              let i = tileRefs.current.length;

              while (--i > -1) {
                if (this.hitTest(tileRefs.current[i], "0")) {
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

              if (
                hitTileWithHighestCoverage !==
                previousHighestCoverageTile.current
              ) {
                // Scale down the PREVIOUS winner if it exists
                if (previousHighestCoverageTile.current) {
                  gsap.to(previousHighestCoverageTile.current.parentElement, {
                    borderColor: "transparent",
                    duration: 0.2, // A short duration for responsiveness
                    overwrite: "auto", // Prevents conflicting tweens on the same element
                  });

                  gsap.to(previousHighestCoverageTile.current, {
                    scale: 1,
                    duration: 0.2, // A short duration for responsiveness
                    overwrite: "auto", // Prevents conflicting tweens on the same element
                  });
                }

                // Scale up the NEW winner if it exists
                if (hitTileWithHighestCoverage) {
                  gsap.to(hitTileWithHighestCoverage.parentElement, {
                    borderColor: "gray",
                    duration: 0.2, // A short duration for responsiveness
                    overwrite: "auto", // Prevents conflicting tweens on the same element
                  });
                  gsap.to(hitTileWithHighestCoverage, {
                    scale: 0.9,
                    duration: 0.2,
                    overwrite: "auto",
                  });
                }

                // 3. UPDATE THE REFERENCE for the next drag event
                previousHighestCoverageTile.current =
                  hitTileWithHighestCoverage;
              }
            },
            onDragEnd: function () {},
          });
        }
      });
    },
    { dependencies: [gridItems] }
  );

  useGSAP(
    () => {
      console.log("useGSAP Flip effect");
      if (flipState.current) {
        // Apply the flip state to animate the grid items
        Flip.from(flipState.current, {
          duration: 0.4,
          props: "zIndex", // Animate the zIndex property
          zIndex: 100, // Ensure flipping elements are on top
        });
      }
    },
    { dependencies: [gridItems] }
  );

  return (
    <div className="bg-white shadow-lg rounded-xl p-2 md:p-8 w-max h-max">
      <div
        ref={gridContainerRef}
        className="grid grid-cols-5 gap-2 bg-orange-100 p-2 border border-orange-900 rounded-lg"
      >
        {gridItems.map((item, index) => (
          <div
            key={`cell-${item.index}`}
            className="grid border-dashed place-items-center relative border border-transparent border-orange-900 aspect-square rounded-full h-[96px] w-[96px]"
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
                  : "text-orange-100 bg-orange-600 border-1 border-b-4 border-orange-900 z-2",
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
