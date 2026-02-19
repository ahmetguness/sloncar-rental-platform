import audiLogo from '../assets/logo/brand_logos/Audi.png';
import bmwLogo from '../assets/logo/brand_logos/BMW.png';
import citroenLogo from '../assets/logo/brand_logos/Citroen.png';
import daciaLogo from '../assets/logo/brand_logos/Dacia.png';
import fiatLogo from '../assets/logo/brand_logos/Fiat.png';
import fordLogo from '../assets/logo/brand_logos/Ford.png';
import hondaLogo from '../assets/logo/brand_logos/Honda.png';
import hyundaiLogo from '../assets/logo/brand_logos/Hyundai.png';
import kiaLogo from '../assets/logo/brand_logos/Kia.png';
import mercedesLogo from '../assets/logo/brand_logos/Mercedes-Benz.png';
import mitsubishiLogo from '../assets/logo/brand_logos/Mitsubishi.png';
import nissanLogo from '../assets/logo/brand_logos/Nissan.png';
import opelLogo from '../assets/logo/brand_logos/Opel.png';
import peugeotLogo from '../assets/logo/brand_logos/Peugeot.png';
import renaultLogo from '../assets/logo/brand_logos/Renault.png';
import seatLogo from '../assets/logo/brand_logos/SEAT.png';
import skodaLogo from '../assets/logo/brand_logos/Skoda.png';
import suzukiLogo from '../assets/logo/brand_logos/Suzuki.png';
import toyotaLogo from '../assets/logo/brand_logos/Toyota.png';
import volkswagenLogo from '../assets/logo/brand_logos/Volkswagen.png';

export interface Brand {
    id: string;
    name: string;
    logoUrl: string;
}

export const BRANDS: Brand[] = [
    { id: 'audi', name: 'Audi', logoUrl: audiLogo },
    { id: 'bmw', name: 'BMW', logoUrl: bmwLogo },
    { id: 'citroen', name: 'Citroen', logoUrl: citroenLogo },
    { id: 'dacia', name: 'Dacia', logoUrl: daciaLogo },
    { id: 'fiat', name: 'Fiat', logoUrl: fiatLogo },
    { id: 'ford', name: 'Ford', logoUrl: fordLogo },
    { id: 'honda', name: 'Honda', logoUrl: hondaLogo },
    { id: 'hyundai', name: 'Hyundai', logoUrl: hyundaiLogo },
    { id: 'kia', name: 'Kia', logoUrl: kiaLogo },
    { id: 'mercedes', name: 'Mercedes-Benz', logoUrl: mercedesLogo },
    { id: 'mitsubishi', name: 'Mitsubishi', logoUrl: mitsubishiLogo },
    { id: 'nissan', name: 'Nissan', logoUrl: nissanLogo },
    { id: 'opel', name: 'Opel', logoUrl: opelLogo },
    { id: 'peugeot', name: 'Peugeot', logoUrl: peugeotLogo },
    { id: 'renault', name: 'Renault', logoUrl: renaultLogo },
    { id: 'seat', name: 'SEAT', logoUrl: seatLogo },
    { id: 'skoda', name: 'Skoda', logoUrl: skodaLogo },
    { id: 'suzuki', name: 'Suzuki', logoUrl: suzukiLogo },
    { id: 'toyota', name: 'Toyota', logoUrl: toyotaLogo },
    { id: 'volkswagen', name: 'Volkswagen', logoUrl: volkswagenLogo },
];
