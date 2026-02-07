import React from 'react'

export default function InfoComponent(waste , value) {
    const infoBox = {
        
    }
    if(waste === "organicWaste"){
        infoBox.title = "Organic Waste";
        
    }
  return (
    <div
          className="rounded-2xl shadow-lg bg-dark-green text-white
                        transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
        >
          <div className="border-b border-white/20 px-6 py-4 text-lg font-semibold">
            Tax Rebate
          </div>

          <div className="p-6 text-center">
            <div className="text-7xl font-extrabold tracking-tight">
              {rebateData.rebatePercent}%
            </div>
            <div className="opacity-90 mb-6">Property Tax Discount</div>

            <div className="space-y-3 text-left">
              <div className="bg-white/10 p-3 rounded-xl flex gap-3">
                📊 Based on compliance performance
              </div>
              <div className="bg-white/10 p-3 rounded-xl flex gap-3">
                 proof(s) submitted
              </div>
            </div>
          </div>
        </div>
  )
}
