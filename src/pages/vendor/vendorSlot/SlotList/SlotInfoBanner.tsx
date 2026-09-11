import { useNavigate } from "react-router-dom";
import { HiInformationCircle } from "react-icons/hi";

const SlotInfoBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="sl-banner">
      <span className="sl-banner-icon">
        <HiInformationCircle size={18} />
      </span>
      <div className="sl-banner-body">
        <p className="sl-banner-title">
          Add your services before creating slots
        </p>
        <p className="sl-banner-desc">
          Slots are tied to the services you offer. Make sure your service
          categories are set up first so you can assign them when adding
          availability.
        </p>
        <ul className="sl-banner-steps">
          <li>
            <span className="sl-banner-pill">Add services you offer</span>
          </li>
          <li>
            <span className="sl-banner-pill">Then create your slots</span>
          </li>
          <li>
            <span className="sl-banner-pill">Set your availability</span>
          </li>
        </ul>
      </div>
      <button
        type="button"
        className="sl-banner-btn"
        onClick={() => navigate("/vendor/services/add")}
      >
        Add service
      </button>
    </div>
  );
};

export default SlotInfoBanner;
