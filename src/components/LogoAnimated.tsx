import React from 'react';

const LogoAnimated: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        <svg 
          width="60" 
          height="60" 
          viewBox="0 0 137 141" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="logo-container"
        >
          <defs>
            {/* Gradientes corrigidos conforme especificação */}
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4E67FF" className="gradient-stop-1">
                <animate attributeName="stop-color" 
                  values="#4E67FF;#4EAFFF;#98D4F8;#4EAFFF;#4E67FF" 
                  dur="8s" repeatCount="indefinite"/>
              </stop>
              <stop offset="79.07%" stopColor="#4EAFFF" className="gradient-stop-2">
                <animate attributeName="stop-color" 
                  values="#4EAFFF;#98D4F8;#4E67FF;#6CCFFF;#4EAFFF" 
                  dur="7s" repeatCount="indefinite"/>
              </stop>
              <stop offset="102.23%" stopColor="#98D4F8" className="gradient-stop-3">
                <animate attributeName="stop-color" 
                  values="#98D4F8;#4E67FF;#4EAFFF;#B8F4F8;#98D4F8" 
                  dur="9s" repeatCount="indefinite"/>
              </stop>
              <animateTransform attributeName="gradientTransform" 
                type="translate" 
                values="0,0;20,0;-20,0;0,0" 
                dur="12s" repeatCount="indefinite"/>
            </linearGradient>
            
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4E67FF" className="gradient-stop-4">
                <animate attributeName="stop-color" 
                  values="#4E67FF;#6B73FF;#4EAFFF;#5A7FFF;#4E67FF" 
                  dur="8.5s" repeatCount="indefinite"/>
              </stop>
              <stop offset="79.07%" stopColor="#4EAFFF" className="gradient-stop-5">
                <animate attributeName="stop-color" 
                  values="#4EAFFF;#5BBFFF;#98D4F8;#6CCFFF;#4EAFFF" 
                  dur="7.5s" repeatCount="indefinite"/>
              </stop>
              <stop offset="102.23%" stopColor="#98D4F8" className="gradient-stop-6">
                <animate attributeName="stop-color" 
                  values="#98D4F8;#A8E4F8;#4E67FF;#C8E4F8;#98D4F8" 
                  dur="9.5s" repeatCount="indefinite"/>
              </stop>
              <animateTransform attributeName="gradientTransform" 
                type="translate" 
                values="0,0;-15,0;18,0;0,0" 
                dur="14s" repeatCount="indefinite"/>
            </linearGradient>

            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4E67FF" className="gradient-stop-7">
                <animate attributeName="stop-color" 
                  values="#4E67FF;#5A7FFF;#6B73FF;#4EAFFF;#4E67FF" 
                  dur="7.2s" repeatCount="indefinite"/>
              </stop>
              <stop offset="79.07%" stopColor="#4EAFFF" className="gradient-stop-8">
                <animate attributeName="stop-color" 
                  values="#4EAFFF;#6CCFFF;#5BBFFF;#98D4F8;#4EAFFF" 
                  dur="8.8s" repeatCount="indefinite"/>
              </stop>
              <stop offset="102.23%" stopColor="#98D4F8" className="gradient-stop-9">
                <animate attributeName="stop-color" 
                  values="#98D4F8;#B8F4F8;#A8E4F8;#4E67FF;#98D4F8" 
                  dur="10s" repeatCount="indefinite"/>
              </stop>
              <animateTransform attributeName="gradientTransform" 
                type="translate" 
                values="0,0;25,0;-10,0;0,0" 
                dur="16s" repeatCount="indefinite"/>
            </linearGradient>

            {/* Filtro de brilho intensificado */}
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          
          {/* Paths originais do novo logo com efeito de largura das linhas mais evidente */}
          <path 
            d="M126.324 6.14298L121.632 4.13948C108.381 0.521207 25.7225 116.276 12.5608 113.136L17.1939 115.14C30.3261 118.25 112.985 2.49481 126.324 6.14298Z" 
            fill="url(#gradient1)"
            className="logo-path original-path-1"
            filter="url(#softGlow)"
          />
          
          {/* Versão stroke com efeito mais dramático */}
          <path 
            d="M126.324 6.14298L121.632 4.13948C108.381 0.521207 25.7225 116.276 12.5608 113.136L17.1939 115.14C30.3261 118.25 112.985 2.49481 126.324 6.14298Z" 
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
            className="logo-stroke stroke-path-1"
            filter="url(#softGlow)"
            opacity="0.8"
          >
            <animate attributeName="stroke-width" 
              values="2;0.2;3;0.5;2" 
              dur="2s" 
              repeatCount="indefinite"/>
            <animate attributeName="opacity" 
              values="0.8;0.3;1;0.6;0.8" 
              dur="2s" 
              repeatCount="indefinite"/>
          </path>
          
          <path 
            d="M116.736 2.10195L112.103 0.098443C104.165 -2.05458 77.2805 31.4966 50.0718 62.6556C42.34 52.3092 37.8249 48.362 33.723 48.6012L28.5291 49.289C33.2213 48.9002 38.0905 53.894 47.0027 66.1842C45.9698 67.3803 44.937 68.5764 43.9041 69.7426C42.7237 68.098 30.8014 49.6478 23.3058 50.0664L18.1119 50.7542C25.7551 50.1561 38.4446 70.0417 40.835 73.331C39.8021 74.557 38.7693 75.7532 37.7364 76.9194C32.5425 68.6661 20.4727 51.5018 13.1541 51.5018C13.1541 51.5018 9.81946 51.2925 6.75036 52.2195C-0.951877 54.5818 -1.74866 102.337 2.76645 108.856C2.88449 109.035 3.09106 109.185 3.29764 109.304C4.27148 109.753 7.48813 111.158 7.48813 111.158C20.7088 114.298 103.486 -1.51632 116.736 2.10195ZM14.8953 102.038C14.5116 94.5622 14.9543 64.2704 17.2561 57.5123C18.407 58.7383 19.6465 60.1737 20.9744 61.8482C20.7088 65.3768 19.1743 87.6845 19.5874 97.3132C17.9348 99.0476 16.3708 100.632 14.8953 102.038ZM34.6673 80.4479C31.008 84.6942 27.5553 88.6414 24.3386 92.1699C24.3681 90.3757 24.6042 71.4172 25.46 67.7391C25.8437 68.2774 30.0342 74.0487 34.6673 80.4479ZM10.3506 52.8773C11.295 53.1764 12.2688 53.6847 13.3312 54.4024C10.2031 62.7154 8.99316 94.8612 10.6753 105.716C9.28827 106.793 8.01932 107.66 6.89792 108.258C6.86841 108.078 6.8389 107.899 6.77988 107.72C4.06491 98.7785 4.5961 55.2696 10.3506 52.8773Z" 
            fill="url(#gradient2)"
            className="logo-path original-path-2"
            filter="url(#softGlow)"
          />
          
          {/* Versão stroke com efeito mais dramático */}
          <path 
            d="M116.736 2.10195L112.103 0.098443C104.165 -2.05458 77.2805 31.4966 50.0718 62.6556C42.34 52.3092 37.8249 48.362 33.723 48.6012L28.5291 49.289C33.2213 48.9002 38.0905 53.894 47.0027 66.1842C45.9698 67.3803 44.937 68.5764 43.9041 69.7426C42.7237 68.098 30.8014 49.6478 23.3058 50.0664L18.1119 50.7542C25.7551 50.1561 38.4446 70.0417 40.835 73.331C39.8021 74.557 38.7693 75.7532 37.7364 76.9194C32.5425 68.6661 20.4727 51.5018 13.1541 51.5018C13.1541 51.5018 9.81946 51.2925 6.75036 52.2195C-0.951877 54.5818 -1.74866 102.337 2.76645 108.856C2.88449 109.035 3.09106 109.185 3.29764 109.304C4.27148 109.753 7.48813 111.158 7.48813 111.158C20.7088 114.298 103.486 -1.51632 116.736 2.10195ZM14.8953 102.038C14.5116 94.5622 14.9543 64.2704 17.2561 57.5123C18.407 58.7383 19.6465 60.1737 20.9744 61.8482C20.7088 65.3768 19.1743 87.6845 19.5874 97.3132C17.9348 99.0476 16.3708 100.632 14.8953 102.038ZM34.6673 80.4479C31.008 84.6942 27.5553 88.6414 24.3386 92.1699C24.3681 90.3757 24.6042 71.4172 25.46 67.7391C25.8437 68.2774 30.0342 74.0487 34.6673 80.4479ZM10.3506 52.8773C11.295 53.1764 12.2688 53.6847 13.3312 54.4024C10.2031 62.7154 8.99316 94.8612 10.6753 105.716C9.28827 106.793 8.01932 107.66 6.89792 108.258C6.86841 108.078 6.8389 107.899 6.77988 107.72C4.06491 98.7785 4.5961 55.2696 10.3506 52.8773Z" 
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="1.5"
            className="logo-stroke stroke-path-2"
            filter="url(#softGlow)"
            opacity="0.7"
          >
            <animate attributeName="stroke-width" 
              values="1.5;0.1;2.5;0.3;1.5" 
              dur="2.3s" 
              repeatCount="indefinite"/>
            <animate attributeName="opacity" 
              values="0.7;0.2;0.9;0.4;0.7" 
              dur="2.3s" 
              repeatCount="indefinite"/>
          </path>
          
          <path 
            d="M135.951 10.291L132.085 8.6762C118.746 5.02803 36.0577 120.723 22.8665 117.583L27.4996 119.587C31.7492 120.603 39.6285 113.098 50.1637 101.346C65.1255 122.069 77.6085 140.698 84.5139 140.579L89.7078 139.831C81.6809 140.01 66.6306 116.238 53.2918 97.8471C54.2952 96.7108 55.328 95.5147 56.3904 94.3186C81.976 129.634 87.8486 139.293 94.6951 139.173L99.8889 138.426C93.249 138.575 88.5864 130.77 59.489 90.7601C60.5219 89.564 61.5548 88.3679 62.5876 87.1418C93.4851 129.485 97.9707 137.409 104.375 137.349C106.086 137.319 108.27 137.259 109.509 136.631C120.399 131.01 138.016 24.166 136.954 11.7263C136.895 11.0385 136.511 10.5302 135.951 10.291ZM65.6567 83.5236C72.5917 75.4497 104.758 39.1773 112.106 30.8045C111.25 37.5925 98.4429 102.691 92.8359 120.872C92.0096 119.706 80.2939 103.559 65.6567 83.5236ZM96.2591 125.507C104.552 102.123 116.179 33.4957 117.566 24.6743C119.513 22.5213 121.373 20.5776 123.114 18.8432C122.287 27.7843 107.355 111.453 99.7414 129.784C98.6495 128.528 97.4986 127.122 96.2591 125.507ZM106.145 135.555C105.171 135.017 104.138 134.239 102.988 133.193C111.988 117.194 127.57 22.4316 127.983 14.3877C129.754 12.9224 131.377 11.8459 132.823 11.1881C133.472 22.8503 115.972 123.265 106.145 135.555Z" 
            fill="url(#gradient3)"
            className="logo-path original-path-3"
            filter="url(#softGlow)"
          />
          
          {/* Versão stroke com efeito mais dramático */}
          <path 
            d="M135.951 10.291L132.085 8.6762C118.746 5.02803 36.0577 120.723 22.8665 117.583L27.4996 119.587C31.7492 120.603 39.6285 113.098 50.1637 101.346C65.1255 122.069 77.6085 140.698 84.5139 140.579L89.7078 139.831C81.6809 140.01 66.6306 116.238 53.2918 97.8471C54.2952 96.7108 55.328 95.5147 56.3904 94.3186C81.976 129.634 87.8486 139.293 94.6951 139.173L99.8889 138.426C93.249 138.575 88.5864 130.77 59.489 90.7601C60.5219 89.564 61.5548 88.3679 62.5876 87.1418C93.4851 129.485 97.9707 137.409 104.375 137.349C106.086 137.319 108.27 137.259 109.509 136.631C120.399 131.01 138.016 24.166 136.954 11.7263C136.895 11.0385 136.511 10.5302 135.951 10.291ZM65.6567 83.5236C72.5917 75.4497 104.758 39.1773 112.106 30.8045C111.25 37.5925 98.4429 102.691 92.8359 120.872C92.0096 119.706 80.2939 103.559 65.6567 83.5236ZM96.2591 125.507C104.552 102.123 116.179 33.4957 117.566 24.6743C119.513 22.5213 121.373 20.5776 123.114 18.8432C122.287 27.7843 107.355 111.453 99.7414 129.784C98.6495 128.528 97.4986 127.122 96.2591 125.507ZM106.145 135.555C105.171 135.017 104.138 134.239 102.988 133.193C111.988 117.194 127.57 22.4316 127.983 14.3877C129.754 12.9224 131.377 11.8459 132.823 11.1881C133.472 22.8503 115.972 123.265 106.145 135.555Z" 
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth="1.8"
            className="logo-stroke stroke-path-3"
            filter="url(#softGlow)"
            opacity="0.6"
          >
            <animate attributeName="stroke-width" 
              values="1.8;0.15;3;0.4;1.8" 
              dur="2.7s" 
              repeatCount="indefinite"/>
            <animate attributeName="opacity" 
              values="0.6;0.1;1;0.3;0.6" 
              dur="2.7s" 
              repeatCount="indefinite"/>
          </path>
        </svg>
        
        {/* Aura intensificada de respiração */}
        <div className="absolute inset-0 neural-aura"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .logo-container {
            filter: drop-shadow(0 0 12px rgba(78, 175, 255, 0.3));
            animation: logoBreath 4s ease-in-out infinite;
          }
          
          /* Animação de respiração da logo mais intensa */
          @keyframes logoBreath {
            0%, 100% { 
              transform: scale(1);
              filter: drop-shadow(0 0 12px rgba(78, 175, 255, 0.3));
            }
            50% { 
              transform: scale(1.04);
              filter: drop-shadow(0 0 20px rgba(78, 175, 255, 0.5));
            }
          }
          
          /* Paths originais com movimentos pulsantes mais evidentes */
          .original-path-1 {
            animation: pathGlow1 2s ease-in-out infinite, pathPulse1 1.8s ease-in-out infinite;
          }
          
          .original-path-2 {
            animation: pathGlow2 2.5s ease-in-out infinite, pathPulse2 2.1s ease-in-out infinite;
          }
          
          .original-path-3 {
            animation: pathGlow3 3s ease-in-out infinite, pathPulse3 2.4s ease-in-out infinite;
          }
          
          @keyframes pathGlow1 {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; }
          }
          
          @keyframes pathGlow2 {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
          
          @keyframes pathGlow3 {
            0%, 100% { opacity: 0.88; }
            50% { opacity: 1; }
          }
          
          /* Movimentos pulsantes mais dramáticos */
          @keyframes pathPulse1 {
            0%, 100% { 
              transform: scale(1) translateY(0px);
            }
            50% { 
              transform: scale(1.015) translateY(-1px);
            }
          }
          
          @keyframes pathPulse2 {
            0%, 100% { 
              transform: scale(1) translateX(0px);
            }
            50% { 
              transform: scale(1.012) translateX(0.8px);
            }
          }
          
          @keyframes pathPulse3 {
            0%, 100% { 
              transform: scale(1) translateY(0px) translateX(0px);
            }
            50% { 
              transform: scale(1.018) translateY(1.2px) translateX(-0.6px);
            }
          }
          
          /* Aura de respiração mais intensa */
          .neural-aura {
            background: radial-gradient(circle, rgba(78, 175, 255, 0.12) 0%, transparent 70%);
            border-radius: 50%;
            animation: auraBreath 5s ease-in-out infinite;
          }
          
          @keyframes auraBreath {
            0%, 100% { 
              transform: scale(0.8);
              opacity: 0.4;
            }
            50% { 
              transform: scale(1.2);
              opacity: 0.8;
            }
          }
          
          /* Efeito de stroke mais dramático */
          .logo-stroke {
            animation: strokePulse 3s ease-in-out infinite;
          }
          
          @keyframes strokePulse {
            0%, 100% { 
              filter: drop-shadow(0 0 4px rgba(78, 175, 255, 0.4));
            }
            50% { 
              filter: drop-shadow(0 0 8px rgba(78, 175, 255, 0.8));
            }
          }
        `
      }} />
    </div>
  );
};

export default LogoAnimated;