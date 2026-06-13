import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

// Landing page for Google OAuth redirect — backend sends ?token=<jwt> here
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
    navigate("/", { replace: true });
  }, []);

  return null;
}
