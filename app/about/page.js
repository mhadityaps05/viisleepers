import React from "react"

export default function about() {
  return (
    <div className="relative z-10 mt-[100vh] w-full min-h-screen bg-black font-benguiat overflow-hidden">
      <div className="lg:grid grid-cols-2 grid-rows-1 gap-2">
        <div className="lg:row-span-2">
          <img src={"img1.png"} alt="img" className="w-[140%] object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:pr-2 p-2">
          <img src={"preview1.png"} className="w-full cursor-pointer" />
          <img src={"preview2.png"} className="w-full cursor-pointer" />
        </div>

        <div className="absolute z-12 w-auto top-[40%] lg:top-[55%] left-2 md:left-5 px-2 md:px-0">
          <h1 className="text-2xl md:text-5xl">
            BUILT FOR THOSE WHO
            <br /> KNOW
          </h1>
          <h2 className="text-xs md:text-base w-full md:w-95 mt-5 md:mt-10 md:ml-50">
            Featuring a structured fit, button-front closure, and functional
            utility pockets, the Utility Work Jacket delivers timeless workwear
            aesthetics with contemporary refinement. Perfect for layering
            through every season, from the city to the studio.
          </h2>
        </div>
      </div>
    </div>
  )
}
