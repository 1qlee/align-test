import './App.css'
import { useRef, useState } from 'react';
import { gridData } from './data/grid';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Draggable } from 'gsap/Draggable';
import clsx from 'clsx';

gsap.registerPlugin(useGSAP, Draggable);

function App() {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const tileRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    // the max area taken up by a dragged tile
    let maxOverlapArea = 0;
    // the tile that is being hovered by a dragged tile and has maxOverlapArea
    let overlappedTileIndex: number | null = null;
    // the tile that was previously hovered by a dragged tile and had the maxOverlapArea
    let previouslyOverlappedTile: HTMLElement | null = null; 

    tileRefs.current.forEach(item => {
      if (item && item.dataset.locked === "false") { 
        Draggable.create(item, { 
          type: "x,y",
          bounds: gridContainerRef.current, 
          inertia: false,
          edgeResistance: 0.75,
          onPress: function() {
            if (item.dataset.index) {
              setDraggedItem(+item.dataset.index);
            }

            gsap.set(item.parentElement, {
              borderColor: "gray",
              overwrite: true
            })

            gsap.to(item, {
              duration: 0.2,
              ease: "power1",
              scale: 0.9,
            })
          },
          onRelease: function() {
            gsap.to(item.parentElement, {
              duration: 0.2,
              borderColor: "transparent",
              overwrite: true
            })
            
            gsap.to(item, {
              duration: 0.2,
              scale: 1,
            })

            // On release, un-animate any currently animated tile
            if (previouslyOverlappedTile) {
              gsap.to(previouslyOverlappedTile.parentElement, {
                duration: 0.2,
                borderColor: "transparent",
                overwrite: true,
              })
              gsap.to(previouslyOverlappedTile, {
                duration: 0.2,
                ease: "power1",
                scale: 1
              });
              previouslyOverlappedTile = null; // Reset the tracking
            }
            maxOverlapArea = 0; // Reset for the next drag
            overlappedTileIndex = null; // Reset for the next drag
          },
          onDrag: function () {
            maxOverlapArea = 0;
            let currentMostOverlappedTile: HTMLSpanElement | null = null;

            // Get the bounding rectangle of the dragged item
            const draggedRect = item.getBoundingClientRect();

            // Iterate through all other tileRefs
            tileRefs.current.forEach((tile) => {
              // Ensure the tile exists and is not the dragged item itself
              if (tile && tile !== item && tile.dataset.locked === "false" && tile.parentElement) {
                const tileRect = tile.parentElement.getBoundingClientRect();

                // Check for intersection
                // An intersection occurs if:
                // 1. The right edge of the dragged item is greater than the left edge of the other item AND
                // 2. The left edge of the dragged item is less than the right edge of the other item AND
                // 3. The bottom edge of the dragged item is greater than the top edge of the other item AND
                // 4. The top edge of the dragged item is less than the bottom edge of the other item
                if (
                  draggedRect.right > tileRect.left &&
                  draggedRect.left < tileRect.right &&
                  draggedRect.bottom > tileRect.top &&
                  draggedRect.top < tileRect.bottom
                ) {
                  const intersectionLeft = Math.max(draggedRect.left, tileRect.left);
                  const intersectionRight = Math.min(draggedRect.right, tileRect.right);
                  const intersectionTop = Math.max(draggedRect.top, tileRect.top);
                  const intersectionBottom = Math.min(draggedRect.bottom, tileRect.bottom);

                  const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
                  const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

                  const currentOverlapArea = intersectionWidth * intersectionHeight;

                  if (currentOverlapArea > maxOverlapArea) {
                    maxOverlapArea = currentOverlapArea;
                    currentMostOverlappedTile = tile; // Keep track of the actual tile element

                    if (tile.dataset.index) {
                      overlappedTileIndex = +tile.dataset.index;
                    }
                  }
                  
                }
              }
            });

            // If there's a new most overlapped tile and it's different from the previously animated one
            if (currentMostOverlappedTile && currentMostOverlappedTile !== previouslyOverlappedTile) {
              // Un-animate the previously animated tile
              if (previouslyOverlappedTile) {
                gsap.to(previouslyOverlappedTile.parentElement, {
                  duration: 0.2,
                  borderColor: "transparent",
                  overwrite: true,
                })
                gsap.to(previouslyOverlappedTile, {
                  duration: 0.2,
                  ease: "power1",
                  scale: 1
                });
              }

              // Animate the new most overlapped tile
              gsap.to(currentMostOverlappedTile, {
                duration: 0.2,
                ease: "power1",
                scale: 0.9
              });

              // Type assertion here: Tell TypeScript that currentMostOverlappedTile is an HTMLSpanElement
              // and therefore has parentElement.
              // We've already ensured it's not null with the outer 'if' condition.
              gsap.to((currentMostOverlappedTile as HTMLSpanElement).parentElement, {
                duration: 0.2,
                borderColor: "gray",
                overwrite: true,
              });

              // Update the previouslyOverlappedTile
              previouslyOverlappedTile = currentMostOverlappedTile;
            } else if (!currentMostOverlappedTile && previouslyOverlappedTile) {
              // If no tile is currently overlapped, and there was a previously animated tile, un-animate it
              gsap.to(previouslyOverlappedTile, {
                duration: 0.2,
                ease: "power1",
                scale: 1
              });
              gsap.to(previouslyOverlappedTile.parentElement, {
                duration: 0.2,
                borderColor: "transparent",
                overwrite: true,
              });
              previouslyOverlappedTile = null;
            }
          },
          onDragEnd: function () {
            gsap.to(this.target, {
              duration: 0.2,
              scale: 1,
              x: 0,
              y: 0,
              onComplete: () => {
                setDraggedItem(null);
              }
            })
          }
        })
      }
    })
  })

  return (
    <div className="bg-white shadow-lg rounded-xl p-2 md:p-8 max-w-full w-full sm:max-w-md lg:max-w-lg">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Align</h1>
      <div ref={gridContainerRef} className="grid grid-cols-5 gap-1">
        {gridData.map((item, index) => (
          <div
            key={`cell-${index}`}
            className={clsx(
              draggedItem === item.index ? "border-dashed" : "border-dashed",
              `grid place-items-center relative border border-transparent border-orange-900 aspect-square rounded-full h-[64px] w-[64px]`
            )}
          >
            <span
              ref={el => {
                tileRefs.current[index] = el;
              }}
              data-locked={item.locked}
              data-index={item.index}
              className={clsx(
                item.locked ?
                  'bg-orange-100 text-orange-900' :
                  'text-orange-100 bg-orange-600 border-1 border-b-4 border-orange-700'
                ,
                `relative flex items-center justify-center
                font-bold text-lg
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
  )
}

export default App
