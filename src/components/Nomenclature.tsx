import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

export function Nomenclature() {
  return (
    <div className="nomenclature">
      <div className="nom-section">
        <h3 className="modal-section-title">Nature Scoring Variables</h3>
        <table className="nom-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Description</th>
              <th>Unit / Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="nom-sym"><InlineMath math="W_f" /></td>
              <td className="nom-desc">Total Freshwater Load across all crops</td>
              <td className="nom-units">m³</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="N_{ha}" /></td>
              <td className="nom-desc">Synthetic Nitrogen application rate</td>
              <td className="nom-units">kg N / ha</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="T_{ill}" /></td>
              <td className="nom-desc">Tillage intensity load (crop-specific weighting)</td>
              <td className="nom-units">0.0 – 1.5</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="D_b" /></td>
              <td className="nom-desc">Diversity Bonus (based on unique crop count)</td>
              <td className="nom-units">0 – 18 points</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="\theta_n" /></td>
              <td className="nom-desc">Ecological Threshold for variable <InlineMath math="n" /></td>
              <td className="nom-units">Variable</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="nom-section">
        <h3 className="modal-section-title">Financial Variables</h3>
        <table className="nom-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Description</th>
              <th>Unit / Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="nom-sym"><InlineMath math="R_{crop}" /></td>
              <td className="nom-desc">Total Gross Crop Revenue</td>
              <td className="nom-units">GBP (£)</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="\phi_{ret}" /></td>
              <td className="nom-desc">Subsidy Retention Rate (transition risk)</td>
              <td className="nom-units">0.2 – 1.0</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="S_{risk}" /></td>
              <td className="nom-desc">
                Total Subsidy at Risk: 
                <div className="nom-formula">
                  <InlineMath math="S_{risk} = R_{crop} \times \left(\frac{\delta}{100 - \delta}\right) \times (1 - \phi_{ret})" />
                </div>
                Where <InlineMath math="\delta" /> is the subsidy dependence slider.
              </td>
              <td className="nom-units">GBP (£)</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="E_{total}" /></td>
              <td className="nom-desc">Total Nature-Related Financial Exposure</td>
              <td className="nom-units">GBP (£)</td>
            </tr>
            <tr>
              <td className="nom-sym"><InlineMath math="\Omega_{up}" /></td>
              <td className="nom-desc">Transition Upside (ELM + BNG + Premium)</td>
              <td className="nom-units">GBP (£) / ha</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
